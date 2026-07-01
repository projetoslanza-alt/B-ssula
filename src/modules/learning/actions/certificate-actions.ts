"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession, hasPermission } from "@/modules/core/auth/session";
import { getErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import {
  generateCertificatePdf,
  generateValidationCode,
} from "@/modules/learning/services/certificate-pdf";

const CERT_BUCKET = "learning-certificates";

export async function issueCertificateAction(enrollmentId: string) {
  try {
    const session = await requireSession();
    const supabase = await createClient();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, tenant_id, course_id, course_version_id")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment) return { error: "Matrícula não encontrada." };

    const isOwner = enrollment.user_id === session.userId;
    if (!isOwner && !hasPermission(session, "learning.certificate.issue")) {
      return { error: "Sem permissão para emitir certificado." };
    }

    const { data: eligibility } = await supabase.rpc("evaluate_certificate_eligibility", {
      p_enrollment_id: enrollmentId,
    });

    const elig = eligibility as { eligible?: boolean; reason?: string; final_score?: number };
    if (!elig?.eligible) {
      return { error: `Não elegível: ${elig?.reason ?? "requisitos pendentes"}` };
    }

    const { data: existing } = await supabase
      .from("certificates")
      .select("id, validation_code, status")
      .eq("enrollment_id", enrollmentId)
      .eq("status", "valid")
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        certificateId: existing.id,
        validationCode: existing.validation_code,
        idempotent: true,
      };
    }

    const { data: versionRow } = await supabase
      .from("course_versions")
      .select("title, workload_minutes, instructor_id")
      .eq("id", enrollment.course_version_id)
      .single();

    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", enrollment.user_id)
      .single();

    const { data: instructor } = await supabase
      .from("profiles")
      .select("full_name, job_title, signature_storage_path")
      .eq("id", versionRow?.instructor_id)
      .maybeSingle();

    const studentName = studentProfile?.full_name ?? "Aluno";
    const instructorName = instructor?.full_name ?? "Professor";
    const validationCode = generateValidationCode();
    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const validationUrl = `${baseUrl}/validar-certificado?code=${validationCode}`;
    const completedAt = new Date().toLocaleDateString("pt-BR");
    const workloadHours = Math.round((versionRow?.workload_minutes ?? 1200) / 60);

    const pdfBytes = await generateCertificatePdf({
      studentName,
      courseTitle: versionRow?.title ?? "Curso",
      workloadHours,
      instructorName,
      instructorRole: instructor?.job_title ?? "Professor do curso",
      institution: "UVC — Universidade Vendas com Ciência",
      completedAt,
      city: "Belo Horizonte",
      validationCode,
      validationUrl,
    });

    const checksum = createHash("sha256").update(pdfBytes).digest("hex");
    const storagePath = `${enrollment.tenant_id}/${enrollment.user_id}/${validationCode}.pdf`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(CERT_BUCKET)
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: false });

    if (uploadError) return { error: "Falha ao salvar PDF do certificado." };

    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .insert({
        tenant_id: enrollment.tenant_id,
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        course_version_id: enrollment.course_version_id,
        enrollment_id: enrollmentId,
        validation_code: validationCode,
        status: "valid",
        student_name_snapshot: studentName,
        course_title_snapshot: versionRow?.title,
        workload_hours_snapshot: workloadHours,
        instructor_user_id: versionRow?.instructor_id,
        instructor_name_snapshot: instructorName,
        instructor_role_snapshot: instructor?.job_title ?? "Professor do curso",
        instructor_signature_snapshot: instructor?.signature_storage_path,
        institution_snapshot: "UVC — Universidade Vendas com Ciência",
        city_snapshot: "Belo Horizonte",
        final_score_snapshot: elig.final_score,
        file_bucket: CERT_BUCKET,
        file_path: storagePath,
        checksum_sha256: checksum,
        qr_code_url: validationUrl,
        is_demo: false,
      })
      .select("id, validation_code")
      .single();

    if (certError || !cert) return { error: "Não foi possível registrar o certificado." };

    await supabase.from("notifications").insert({
      tenant_id: enrollment.tenant_id,
      user_id: enrollment.user_id,
      type: "certificate_issued",
      title: "Certificado emitido",
      message: `Seu certificado do curso ${versionRow?.title} está disponível.`,
      link: "/universidade/certificados",
    });

    await recordAuditEvent(supabase, {
      tenantId: enrollment.tenant_id,
      actorId: session.userId,
      affectedUserId: enrollment.user_id,
      action: AuditActions.CERTIFICATE_ISSUED,
      entityType: "certificate",
      entityId: cert.id,
      metadata: { validationCode },
    });

    revalidatePath("/universidade/certificados");
    return { success: true, certificateId: cert.id, validationCode: cert.validation_code };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function validatePublicCertificateAction(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_public_certificate", { p_code: code });
  if (error || !data) return { status: "not_found" as const };
  return data as {
    status: "valid" | "revoked" | "expired" | "not_found";
    certificate?: Record<string, unknown>;
  };
}
