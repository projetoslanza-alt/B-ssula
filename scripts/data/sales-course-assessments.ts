/** Conteúdo estruturado das 7 avaliações — extraído dos PDFs fonte (não expostos aos alunos). */

export type AssessmentOptionData = {
  label: string;
  feedback: string;
  isCorrect: boolean;
};

export type AssessmentQuestionData = {
  prompt: string;
  options: AssessmentOptionData[];
};

export type LessonAssessmentData = {
  lessonOrder: number;
  fixtureKey: string;
  title: string;
  introduction: string;
  instructions: string;
  questions: AssessmentQuestionData[];
};

export const SALES_COURSE_LESSONS = [
  {
    order: 1,
    fixtureKey: "lesson.sales.01",
    title: "O que é vender de verdade",
    description:
      "Conceito estrutural de venda como processo de diagnóstico, condução e geração de clareza para o cliente.",
    videoFile: "Aula 01.mp4",
    optionalIntroVideo: "Introducao.mp4",
  },
  {
    order: 2,
    fixtureKey: "lesson.sales.02",
    title: "Responsabilidade e mentalidade de alta performance",
    description:
      "Alta performance começa na responsabilidade: identificar padrões mentais que limitam evolução em vendas.",
    videoFile: "Aula 02.mp4",
  },
  {
    order: 3,
    fixtureKey: "lesson.sales.03",
    title: "Rejeição e blindagem emocional",
    description:
      "Interpretar rejeição com maturidade, separar emoção de processo e identificar autossabotagem comercial.",
    videoFile: "Aula 03.mp4",
  },
  {
    order: 4,
    fixtureKey: "lesson.sales.04",
    title: "SPIN Selling na prática",
    description:
      "Estrutura de raciocínio para organizar a conversa, aprofundar percepção de problema e aumentar clareza de decisão.",
    videoFile: "Aula 04.mp4",
  },
  {
    order: 5,
    fixtureKey: "lesson.sales.05",
    title: "AIDA: Estrutura de comunicação em vendas",
    description:
      "Modelo AIDA como estrutura lógica para organizar atenção, interesse, desejo e conduzir ação.",
    videoFile: "Aula 05.mp4",
  },
  {
    order: 6,
    fixtureKey: "lesson.sales.06",
    title: "Storytelling comercial",
    description:
      "Storytelling como ferramenta estratégica para aumentar compreensão, identificação e percepção de valor.",
    videoFile: "Aula 06.mp4",
  },
  {
    order: 7,
    fixtureKey: "lesson.sales.07",
    title: "Rapport: Como criar conexão e assumir o controle",
    description:
      "Rapport como ferramenta de alinhamento, confiança e condução que reduz resistência na interação comercial.",
    videoFile: "Aula 07.mp4",
  },
] as const;

export const SALES_COURSE_ASSESSMENTS: LessonAssessmentData[] = [
  {
    lessonOrder: 1,
    fixtureKey: "assessment.sales.01",
    title: "Avaliação — Aula 1: O que é vender de verdade",
    introduction:
      "Nesta aula, você foi apresentado ao conceito estrutural de venda. Mais do que técnicas, argumentos ou scripts, a venda foi tratada como um processo de diagnóstico, condução e geração de clareza para o cliente. O objetivo desta avaliação é validar sua capacidade de interpretar cenários comerciais com profundidade e identificar os princípios reais de uma venda de alta performance.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Leia com atenção. Algumas questões exigem interpretação estratégica.",
    questions: [
      {
        prompt:
          "Durante uma reunião, o cliente concorda com praticamente tudo que o vendedor fala. Ao final, porém, diz: \"Vou pensar melhor.\" O vendedor conclui que faltou insistência no fechamento. Qual é a análise mais alinhada com a lógica da aula?",
        options: [
          { label: "Faltou pressão comercial", feedback: "Incorreta: pressão sem clareza tende a aumentar resistência", isCorrect: false },
          { label: "Faltou urgência", feedback: "Incorreta: urgência não substitui entendimento do problema", isCorrect: false },
          { label: "O cliente concordou, mas não teve clareza suficiente para decidir", feedback: "Correta: concordar racionalmente não significa enxergar claramente a necessidade da decisão", isCorrect: true },
          { label: "O vendedor deveria ter apresentado mais benefícios", feedback: "Incorreta: excesso de explicação não resolve ausência de clareza", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor percebe que o cliente está respondendo pouco. Então começa a explicar mais detalhes da solução para \"engajar\" a conversa. Qual é o erro estrutural dessa decisão?",
        options: [
          { label: "Falta de conexão emocional", feedback: "Incorreta: conexão pode influenciar, mas não é a raiz do erro", isCorrect: false },
          { label: "Excesso de argumentação antes de entendimento", feedback: "Correta: o vendedor começou a argumentar antes de aprofundar entendimento", isCorrect: true },
          { label: "Falta de domínio técnico", feedback: "Incorreta: o problema não está em conhecimento técnico", isCorrect: false },
          { label: "Baixa autoridade comercial", feedback: "Incorreta: autoridade não substitui diagnóstico", isCorrect: false },
        ],
      },
      {
        prompt: "Qual cenário representa MAIOR controle da venda?",
        options: [
          { label: "O vendedor conduz a reunião falando bastante", feedback: "Incorreta: falar mais não significa conduzir melhor", isCorrect: false },
          { label: "O vendedor responde rapidamente todas as objeções", feedback: "Incorreta: responder objeção não é controlar o processo", isCorrect: false },
          { label: "O cliente organiza melhor o próprio raciocínio através das perguntas do vendedor", feedback: "Correta: perguntas bem conduzidas organizam o pensamento do cliente", isCorrect: true },
          { label: "O vendedor apresenta todos os diferenciais antes do cliente perder interesse", feedback: "Incorreta: apresentação não substitui condução", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor acredita que: \"Se eu explicar bem a solução, o cliente naturalmente vai comprar.\" Qual é o principal erro dessa mentalidade?",
        options: [
          { label: "Excesso de foco em comunicação", feedback: "Incorreta: comunicação continua sendo importante", isCorrect: false },
          { label: "Falta de urgência", feedback: "Incorreta: urgência não resolve ausência de diagnóstico", isCorrect: false },
          { label: "Confundir clareza da solução com clareza do problema", feedback: "Correta: o cliente só percebe valor quando entende o problema", isCorrect: true },
          { label: "Baixa percepção de valor", feedback: "Incorreta: valor percebido nasce da clareza do problema", isCorrect: false },
        ],
      },
      {
        prompt: "Qual mudança de mentalidade define o vendedor forte apresentado na aula?",
        options: [
          { label: "Pensar em como convencer melhor", feedback: "Incorreta: venda não é convencimento", isCorrect: false },
          { label: "Pensar em como fechar mais rápido", feedback: "Incorreta: velocidade sem clareza enfraquece a decisão", isCorrect: false },
          { label: "Pensar no que o cliente precisa perceber para tomar uma decisão melhor", feedback: "Correta: essa é a principal virada estratégica apresentada na aula", isCorrect: true },
          { label: "Pensar em como apresentar mais valor", feedback: "Incorreta: valor nasce da percepção do cliente, não do excesso de apresentação", isCorrect: false },
        ],
      },
    ],
  },
  {
    lessonOrder: 2,
    fixtureKey: "assessment.sales.02",
    title: "Avaliação — Aula 2: Responsabilidade e mentalidade de alta performance",
    introduction:
      "Nesta aula, você aprendeu que alta performance não começa na técnica. Começa na responsabilidade. O objetivo desta avaliação é medir sua capacidade de identificar padrões mentais que limitam evolução, sabotam execução e impedem crescimento consistente em vendas.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Leia com atenção. Algumas questões exigem interpretação profunda.",
    questions: [
      {
        prompt:
          "Dois vendedores recebem o mesmo lead. Um vende. O outro não. O vendedor que perdeu afirma: \"O cliente não estava no momento.\" Qual é a leitura mais alinhada com a aula?",
        options: [
          { label: "Correta, timing define venda", feedback: "Incorreta: timing influencia, mas não explica sozinho a diferença entre os dois vendedores", isCorrect: false },
          { label: "Correta, porque o mercado influencia mais que execução", feedback: "Incorreta: o mercado impacta, mas não pode ser usado como justificativa principal", isCorrect: false },
          { label: "Parcialmente correta, mas ignora diferença de execução", feedback: "Correta: pode existir fator externo, mas a execução continua sendo decisiva", isCorrect: true },
          { label: "Incorreta, tudo depende exclusivamente do vendedor", feedback: "Incorreta: nem tudo depende dele, mas a evolução depende", isCorrect: false },
        ],
      },
      {
        prompt:
          "Após perder uma venda, um vendedor afirma: \"O lead era ruim.\" Qual é o principal problema dessa interpretação?",
        options: [
          { label: "Terceirização da responsabilidade", feedback: "Correta: ele coloca a causa fora dele e perde capacidade de ajuste", isCorrect: true },
          { label: "Falta de técnica comercial", feedback: "Incorreta: o problema está na interpretação, não na técnica", isCorrect: false },
          { label: "Falta de repertório", feedback: "Incorreta: repertório não resolve postura mental", isCorrect: false },
          { label: "Baixa capacidade de negociação", feedback: "Incorreta: negociação não é o ponto central", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor estuda bastante, entende teoria, mas executa pouco. Qual é o principal problema?",
        options: [
          { label: "Falta de inteligência comercial", feedback: "Incorreta: inteligência sem ação não gera resultado", isCorrect: false },
          { label: "Falta de execução", feedback: "Correta: vendas premia execução consistente", isCorrect: true },
          { label: "Falta de estratégia", feedback: "Incorreta: estratégia sem prática continua improdutiva", isCorrect: false },
          { label: "Falta de conhecimento", feedback: "Incorreta: ele já possui conhecimento", isCorrect: false },
        ],
      },
      {
        prompt: "Qual comportamento mais aproxima um vendedor da alta performance?",
        options: [
          { label: "Esperar leads mais qualificados", feedback: "Incorreta: depender do cenário reduz controle", isCorrect: false },
          { label: "Buscar condições perfeitas para executar", feedback: "Incorreta: alta performance nasce em adaptação, não em perfeição", isCorrect: false },
          { label: "Evitar cenários difíceis", feedback: "Incorreta: evitar desconforto limita crescimento", isCorrect: false },
          { label: "Ajustar constantemente a própria execução", feedback: "Correta: vendedores fortes ajustam continuamente", isCorrect: true },
        ],
      },
      {
        prompt:
          "Um vendedor erra e ajusta. Outro erra e justifica. Qual é a diferença central entre eles?",
        options: [
          { label: "Capacidade técnica", feedback: "Incorreta: ambos podem possuir técnica semelhante", isCorrect: false },
          { label: "Perfil emocional", feedback: "Incorreta: emocional influencia, mas não é o centro da diferença", isCorrect: false },
          { label: "Postura diante do resultado", feedback: "Correta: um evolui através do ajuste, o outro se protege através da justificativa", isCorrect: true },
          { label: "Experiência de mercado", feedback: "Incorreta: experiência não garante evolução", isCorrect: false },
        ],
      },
    ],
  },
  {
    lessonOrder: 3,
    fixtureKey: "assessment.sales.03",
    title: "Avaliação — Aula 3: Rejeição e blindagem emocional",
    introduction:
      "Nesta aula, você aprendeu que o \"não\" não é exceção em vendas, ele faz parte da estrutura da profissão. O objetivo desta avaliação é validar sua capacidade de interpretar rejeição com maturidade, separar emoção de processo e identificar padrões de autossabotagem comercial.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. O foco da avaliação é interpretação estratégica.",
    questions: [
      {
        prompt:
          "Após ouvir dois \"nãos\" seguidos, um vendedor começa a falar com menos convicção e evita aprofundar as próximas conversas. O que está acontecendo nesse cenário?",
        options: [
          { label: "Falta de experiência", feedback: "Incorreta: experiência não é a raiz principal do problema", isCorrect: false },
          { label: "Interpretação emocional contaminando a execução", feedback: "Correta: o emocional começou a afetar a qualidade da execução", isCorrect: true },
          { label: "Baixa qualidade de leads", feedback: "Incorreta: o padrão está no vendedor, não no lead", isCorrect: false },
          { label: "Falta de técnica", feedback: "Incorreta: o problema não começou na técnica", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor escuta um \"não\" e conclui: \"Acho que não sou bom em vendas.\" Qual é o principal erro dessa interpretação?",
        options: [
          { label: "Excesso de autocrítica", feedback: "Incorreta: isso é consequência, não raiz", isCorrect: false },
          { label: "Falta de repertório", feedback: "Incorreta: repertório não resolve essa interpretação", isCorrect: false },
          { label: "Falta de confiança", feedback: "Incorreta: confiança foi afetada depois da leitura emocional", isCorrect: false },
          { label: "Confundir rejeição comercial com rejeição pessoal", feedback: "Correta: ele transformou uma rejeição comercial em julgamento pessoal", isCorrect: true },
        ],
      },
      {
        prompt: "Qual comportamento representa maior maturidade comercial diante da rejeição?",
        options: [
          { label: "Interpretar estrategicamente o que o \"não\" revela", feedback: "Correta: o vendedor forte transforma rejeição em informação", isCorrect: true },
          { label: "Desenvolver respostas melhores para objeções", feedback: "Incorreta: objeção é consequência, não leitura estratégica", isCorrect: false },
          { label: "Ignorar rapidamente o \"não\"", feedback: "Incorreta: ignorar impede aprendizado", isCorrect: false },
          { label: "Sofrer menos emocionalmente", feedback: "Incorreta: maturidade não significa ausência de emoção", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor fala com poucas pessoas, recebe alguns \"nãos\" e conclui: \"Isso não funciona.\" Qual é o erro mais relevante?",
        options: [
          { label: "Falta de inteligência emocional", feedback: "Incorreta: emocional influencia, mas não é o centro da análise", isCorrect: false },
          { label: "Baixa qualidade de abordagem", feedback: "Incorreta: não existe volume suficiente para essa conclusão", isCorrect: false },
          { label: "Interpretação baseada em pouca amostragem", feedback: "Correta: ele está criando uma conclusão emocional sem base estatística", isCorrect: true },
          { label: "Falta de argumentação", feedback: "Incorreta: argumento não é o ponto principal", isCorrect: false },
        ],
      },
      {
        prompt: "Qual é a principal função da blindagem emocional em vendas?",
        options: [
          { label: "Tornar o vendedor mais frio", feedback: "Incorreta: blindagem não é frieza", isCorrect: false },
          { label: "Eliminar insegurança", feedback: "Incorreta: insegurança pode continuar existindo", isCorrect: false },
          { label: "Evitar desconforto emocional", feedback: "Incorreta: desconforto faz parte do processo", isCorrect: false },
          { label: "Impedir que emoção desorganize a execução", feedback: "Correta: maturidade emocional é manter qualidade de execução mesmo sob pressão", isCorrect: true },
        ],
      },
    ],
  },
  {
    lessonOrder: 4,
    fixtureKey: "assessment.sales.04",
    title: "Avaliação — Aula 4: SPIN Selling na prática",
    introduction:
      "Nesta aula, você aprendeu que vender não é empurrar solução. É conduzir consciência. O SPIN Selling foi apresentado como uma estrutura de raciocínio capaz de organizar a conversa, aprofundar percepção de problema e aumentar clareza de decisão.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Leia com atenção. Algumas perguntas possuem pegadinhas conceituais.",
    questions: [
      {
        prompt:
          "Um vendedor inicia a conversa apresentando benefícios da solução antes de aprofundar o problema. Qual é o principal risco dessa condução?",
        options: [
          { label: "O cliente não perceber urgência suficiente", feedback: "Incorreta: urgência depende de percepção de problema", isCorrect: false },
          { label: "A conversa perder velocidade", feedback: "Incorreta: velocidade não resolve ausência de clareza", isCorrect: false },
          { label: "O processo de decisão não amadurecer corretamente", feedback: "Correta: solução sem construção de problema gera resistência", isCorrect: true },
          { label: "O vendedor parecer técnico demais", feedback: "Incorreta: tecnicidade não é o centro do erro", isCorrect: false },
        ],
      },
      {
        prompt: "Qual alternativa representa melhor a função da etapa de Implicação no SPIN?",
        options: [
          { label: "Descobrir informações básicas do cenário", feedback: "Incorreta: isso pertence à etapa de Situação", isCorrect: false },
          { label: "Mostrar impacto e consequência do problema", feedback: "Correta: implicação amplia consciência sobre o custo do problema", isCorrect: true },
          { label: "Validar interesse na solução", feedback: "Incorreta: necessidade vem depois da implicação", isCorrect: false },
          { label: "Criar conexão emocional inicial", feedback: "Incorreta: conexão não é a função central dessa etapa", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor transforma a etapa de Situação em uma sequência longa de perguntas desconectadas. Qual é o principal problema dessa execução?",
        options: [
          { label: "A conversa perde naturalidade e fluidez", feedback: "Correta: situação excessiva transforma conversa em interrogatório", isCorrect: true },
          { label: "O cliente percebe pouco valor técnico", feedback: "Incorreta: valor técnico não é o principal problema", isCorrect: false },
          { label: "O vendedor reduz autoridade", feedback: "Incorreta: autoridade pode até permanecer", isCorrect: false },
          { label: "A solução perde impacto", feedback: "Incorreta: o problema acontece antes da solução", isCorrect: false },
        ],
      },
      {
        prompt: "Qual momento representa maior avanço psicológico da venda dentro do SPIN?",
        options: [
          { label: "Quando o vendedor apresenta benefícios relevantes", feedback: "Incorreta: benefício sozinho não gera comprometimento", isCorrect: false },
          { label: "Quando o cliente aceita ouvir a proposta", feedback: "Incorreta: ouvir proposta não significa consciência profunda", isCorrect: false },
          { label: "Quando o cliente verbaliza o próprio problema", feedback: "Correta: quando o cliente verbaliza o problema, ele começa a se posicionar internamente", isCorrect: true },
          { label: "Quando o vendedor explica a solução com clareza", feedback: "Incorreta: explicação não substitui elaboração do cliente", isCorrect: false },
        ],
      },
      {
        prompt: "Qual erro mais enfraquece a lógica do SPIN Selling?",
        options: [
          { label: "Fazer perguntas muito abertas", feedback: "Incorreta: perguntas abertas podem aprofundar entendimento", isCorrect: false },
          { label: "Querer chegar rápido demais na solução", feedback: "Correta: acelerar solução sem maturidade de decisão gera resistência", isCorrect: true },
          { label: "Explorar profundamente implicações", feedback: "Incorreta: implicação fortalece consciência", isCorrect: false },
          { label: "Validar contexto antes de avançar", feedback: "Incorreta: contexto é parte essencial do diagnóstico", isCorrect: false },
        ],
      },
    ],
  },
  {
    lessonOrder: 5,
    fixtureKey: "assessment.sales.05",
    title: "Avaliação — Aula 5: AIDA — Estrutura de comunicação em vendas",
    introduction:
      "Nesta aula, você aprendeu que comunicação forte não é apenas falar bem. É conduzir percepção. O modelo AIDA foi apresentado como uma estrutura lógica de comunicação capaz de organizar atenção, gerar interesse, construir desejo e conduzir ação.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Algumas perguntas exigem leitura estratégica.",
    questions: [
      {
        prompt:
          "Um vendedor inicia a conversa de forma genérica, sem direção clara e sem relevância percebida. Qual etapa do AIDA foi comprometida primeiro?",
        options: [
          { label: "Desejo", feedback: "Incorreta: desejo acontece depois", isCorrect: false },
          { label: "Interesse", feedback: "Incorreta: interesse depende de atenção anterior", isCorrect: false },
          { label: "Ação", feedback: "Incorreta: ação é consequência da jornada", isCorrect: false },
          { label: "Atenção", feedback: "Correta: sem capturar atenção, o restante enfraquece", isCorrect: true },
        ],
      },
      {
        prompt:
          "O cliente continua educadamente na conversa, mas demonstra pouco engajamento real. Qual é a leitura mais alinhada com a lógica da aula?",
        options: [
          { label: "Faltou gerar interesse verdadeiro", feedback: "Correta: presença física não significa conexão mental", isCorrect: true },
          { label: "Faltou técnica de fechamento", feedback: "Incorreta: fechamento acontece depois", isCorrect: false },
          { label: "Faltou aprofundar objeções", feedback: "Incorreta: objeção não é o centro do problema", isCorrect: false },
          { label: "Faltou aumentar urgência", feedback: "Incorreta: urgência sem interesse não sustenta atenção", isCorrect: false },
        ],
      },
      {
        prompt: "Qual situação representa melhor construção de desejo?",
        options: [
          { label: "O cliente percebe vantagem relevante em sair do estado atual", feedback: "Correta: desejo nasce quando a mudança começa a fazer sentido", isCorrect: true },
          { label: "O vendedor apresenta todas as funcionalidades", feedback: "Incorreta: funcionalidade não garante valor percebido", isCorrect: false },
          { label: "O cliente aceita continuar ouvindo", feedback: "Incorreta: continuidade não significa desejo", isCorrect: false },
          { label: "O vendedor aumenta intensidade argumentativa", feedback: "Incorreta: intensidade não substitui construção de valor", isCorrect: false },
        ],
      },
      {
        prompt:
          "Um vendedor gera atenção, interesse e desejo, mas termina a conversa sem direcionar próximo passo. Qual foi o erro principal?",
        options: [
          { label: "Falta de conexão emocional", feedback: "Incorreta: a conexão já sustentou a conversa", isCorrect: false },
          { label: "Falta de aprofundamento técnico", feedback: "Incorreta: tecnicidade não resolve ausência de direção", isCorrect: false },
          { label: "Falta de ação e condução da decisão", feedback: "Correta: sem ação, a comunicação não se converte em avanço", isCorrect: true },
          { label: "Falta de argumentação comercial", feedback: "Incorreta: argumento não substitui condução", isCorrect: false },
        ],
      },
      {
        prompt: "Qual afirmação representa melhor a lógica do AIDA?",
        options: [
          { label: "Comunicação forte é falar com energia", feedback: "Incorreta: energia sem estrutura perde eficiência", isCorrect: false },
          { label: "Comunicação persuasiva é argumentação intensa", feedback: "Incorreta: persuasão não depende apenas de argumento", isCorrect: false },
          { label: "Venda forte nasce de improviso bem executado", feedback: "Incorreta: improviso reduz consistência", isCorrect: false },
          { label: "Comunicação eficiente conduz o cliente por etapas de percepção", feedback: "Correta: AIDA organiza a jornada mental da decisão", isCorrect: true },
        ],
      },
    ],
  },
  {
    lessonOrder: 6,
    fixtureKey: "assessment.sales.06",
    title: "Avaliação — Aula 6: Storytelling comercial",
    introduction:
      "Nesta aula, você aprendeu que clientes não se conectam apenas com informação. Eles se conectam com significado. O storytelling comercial foi apresentado como uma ferramenta estratégica para aumentar compreensão, identificação e percepção de valor através da narrativa.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Leia atentamente os cenários.",
    questions: [
      {
        prompt:
          "Um vendedor apresenta apenas funcionalidades técnicas da solução, sem contextualizar impacto ou transformação. Qual é o principal risco dessa condução?",
        options: [
          { label: "A conversa ficar emocionalmente distante", feedback: "Correta: excesso de lógica sem narrativa reduz conexão", isCorrect: true },
          { label: "O cliente perceber excesso de autoridade", feedback: "Incorreta: autoridade não é o principal problema", isCorrect: false },
          { label: "A solução parecer complexa demais", feedback: "Incorreta: complexidade pode existir, mas não é a raiz", isCorrect: false },
          { label: "O vendedor perder objetividade", feedback: "Incorreta: objetividade não é o ponto central", isCorrect: false },
        ],
      },
      {
        prompt: "Qual é a principal função do storytelling comercial em vendas?",
        options: [
          { label: "Tornar a conversa mais longa", feedback: "Incorreta: storytelling eficiente tende a ser objetivo", isCorrect: false },
          { label: "Organizar lógica dentro de uma estrutura emocionalmente compreensível", feedback: "Correta: narrativa dá contexto emocional para informação", isCorrect: true },
          { label: "Substituir perguntas consultivas", feedback: "Incorreta: storytelling complementa estrutura", isCorrect: false },
          { label: "Impressionar o cliente com repertório", feedback: "Incorreta: foco não é autopromoção", isCorrect: false },
        ],
      },
      {
        prompt: "Qual alternativa representa melhor a estrutura apresentada na aula?",
        options: [
          { label: "Problema, objeção, fechamento e negociação", feedback: "Incorreta: essa não é a estrutura do storytelling", isCorrect: false },
          { label: "Atenção, emoção, lógica e decisão", feedback: "Incorreta: mistura conceitos diferentes", isCorrect: false },
          { label: "Situação, problema, virada e resultado", feedback: "Correta: essa foi a estrutura estratégica apresentada", isCorrect: true },
          { label: "Contexto, urgência, proposta e ação", feedback: "Incorreta: não representa a lógica narrativa da aula", isCorrect: false },
        ],
      },
      {
        prompt: "Quando o storytelling perde força em vendas?",
        options: [
          { label: "Quando a narrativa é usada para gerar identificação", feedback: "Incorreta: identificação fortalece conexão", isCorrect: false },
          { label: "Quando a história facilita entendimento", feedback: "Incorreta: facilitar entendimento é uma das funções centrais", isCorrect: false },
          { label: "Quando o cliente se projeta dentro do cenário", feedback: "Incorreta: projeção aumenta envolvimento", isCorrect: false },
          { label: "Quando a narrativa parece artificial e autopromocional", feedback: "Correta: artificialidade reduz autenticidade e confiança", isCorrect: true },
        ],
      },
      {
        prompt: "Qual frase representa melhor a lógica da aula?",
        options: [
          { label: "Histórias substituem estrutura comercial", feedback: "Incorreta: storytelling complementa estrutura", isCorrect: false },
          { label: "Narrativa forte elimina necessidade de técnica", feedback: "Incorreta: técnica continua necessária", isCorrect: false },
          { label: "Storytelling potencializa percepção e conexão dentro da venda", feedback: "Correta: storytelling fortalece entendimento e conexão", isCorrect: true },
          { label: "O cliente compra principalmente pela emoção", feedback: "Incorreta: emoção influencia, mas não atua sozinha", isCorrect: false },
        ],
      },
    ],
  },
  {
    lessonOrder: 7,
    fixtureKey: "assessment.sales.07",
    title: "Avaliação — Aula 7: Rapport — Como criar conexão e assumir o controle",
    introduction:
      "Nesta aula, você aprendeu que vendas não acontecem apenas através de argumento ou técnica. Elas acontecem através de conexão. O rapport foi apresentado como uma ferramenta estratégica de alinhamento, confiança e condução, capaz de reduzir resistência e aumentar a qualidade da interação comercial.",
    instructions:
      "Cada questão vale 1 ponto. Apenas 1 alternativa correta. Leia com atenção. Algumas questões possuem pegadinhas estratégicas.",
    questions: [
      {
        prompt:
          "Um vendedor tenta criar conexão fazendo piadas o tempo inteiro e tentando agradar excessivamente o cliente. Qual é o principal erro dessa condução?",
        options: [
          { label: "Falta de autoridade comercial", feedback: "Incorreta: autoridade pode até ser afetada, mas não é a raiz principal", isCorrect: false },
          { label: "Uso excessivo de comunicação emocional", feedback: "Incorreta: emoção não é o problema central", isCorrect: false },
          { label: "Confundir rapport com performance de simpatia", feedback: "Correta: rapport não é atuação social, é alinhamento natural", isCorrect: true },
          { label: "Baixa objetividade na venda", feedback: "Incorreta: objetividade não resolve artificialidade", isCorrect: false },
        ],
      },
      {
        prompt:
          "Durante a conversa, o vendedor percebe que o cliente responde de forma extremamente objetiva e rápida. Mesmo assim, continua explicando tudo de forma longa e detalhada. Qual é o principal impacto desse desalinhamento?",
        options: [
          { label: "O cliente tende a perceber distância na comunicação", feedback: "Correta: linguagem desalinhada aumenta atrito e reduz conexão", isCorrect: true },
          { label: "O vendedor perde domínio técnico", feedback: "Incorreta: domínio técnico não é o problema", isCorrect: false },
          { label: "O cliente reduz percepção de urgência", feedback: "Incorreta: urgência não é o centro da situação", isCorrect: false },
          { label: "O vendedor enfraquece a proposta de valor", feedback: "Incorreta: valor pode continuar existindo mesmo com ruído de comunicação", isCorrect: false },
        ],
      },
      {
        prompt: "Qual cenário representa maior presença e rapport durante uma venda?",
        options: [
          { label: "O vendedor mantém alta energia independentemente do cliente", feedback: "Incorreta: energia sem calibragem pode gerar desconexão", isCorrect: false },
          { label: "O vendedor ajusta ritmo, linguagem e profundidade sem parecer artificial", feedback: "Correta: rapport forte nasce de ajuste natural e percepção contextual", isCorrect: true },
          { label: "O vendedor conduz rapidamente para manter controle", feedback: "Incorreta: velocidade não substitui alinhamento", isCorrect: false },
          { label: "O vendedor replica exatamente o jeito do cliente", feedback: "Incorreta: espelhamento não é imitação", isCorrect: false },
        ],
      },
      {
        prompt: "Segundo a lógica da aula, qual é a relação entre rapport e controle?",
        options: [
          { label: "Rapport reduz autoridade para aumentar conforto", feedback: "Incorreta: conforto não exige perda de autoridade", isCorrect: false },
          { label: "Rapport substitui técnicas de condução", feedback: "Incorreta: rapport potencializa técnica, não substitui", isCorrect: false },
          { label: "Rapport cria influência através da redução de resistência", feedback: "Correta: quando a resistência baixa, a condução fica mais natural", isCorrect: true },
          { label: "Rapport funciona apenas em vendas relacionais", feedback: "Incorreta: rapport melhora qualquer interação comercial", isCorrect: false },
        ],
      },
      {
        prompt: "Qual comportamento mais tende a quebrar rapport durante uma conversa?",
        options: [
          { label: "Fazer perguntas profundas", feedback: "Incorreta: profundidade pode aumentar conexão quando bem conduzida", isCorrect: false },
          { label: "Sustentar pausas naturais", feedback: "Incorreta: pausas naturais podem demonstrar presença", isCorrect: false },
          { label: "Ajustar vocabulário ao cliente", feedback: "Incorreta: alinhamento de linguagem fortalece compatibilidade", isCorrect: false },
          { label: "Responder sem escutar completamente", feedback: "Correta: interrupção e falta de escuta quebram alinhamento rapidamente", isCorrect: true },
        ],
      },
    ],
  },
];

export const SALES_COURSE_CONFIG = {
  fixtureKey: "course.sales.opportunity-to-closing",
  slug: "vendas-da-oportunidade-ao-fechamento",
  title: "Vendas: Da Oportunidade ao Fechamento",
  institution: "UVC — Universidade Vendas com Ciência",
  workloadMinutes: 20 * 60,
  passingScore: 70,
  maxAttempts: 3,
  minVideoPercent: 90,
  scoreMode: "aggregate_questions" as const,
};

/** Mapeamento definitivo vídeo → conteúdo */
export const VIDEO_LESSON_MAPPING = [
  {
    order: 0,
    lessonTitle: "Introdução — Boas-vindas e visão geral do curso",
    videoFile: "Introducao.mp4",
    fixtureKey: "media.sales.lesson.00.intro",
    required: false,
    hasAssessment: false,
    status: "confirmado" as const,
  },
  {
    order: 1,
    lessonTitle: "O que é vender de verdade",
    videoFile: "Aula 01.mp4",
    fixtureKey: "media.sales.lesson.01",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 2,
    lessonTitle: "Responsabilidade e mentalidade de alta performance",
    videoFile: "Aula 02.mp4",
    fixtureKey: "media.sales.lesson.02",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 3,
    lessonTitle: "Rejeição e blindagem emocional",
    videoFile: "Aula 03.mp4",
    fixtureKey: "media.sales.lesson.03",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 4,
    lessonTitle: "SPIN Selling na prática",
    videoFile: "Aula 04.mp4",
    fixtureKey: "media.sales.lesson.04",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 5,
    lessonTitle: "AIDA: Estrutura de comunicação em vendas",
    videoFile: "Aula 05.mp4",
    fixtureKey: "media.sales.lesson.05",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 6,
    lessonTitle: "Storytelling comercial",
    videoFile: "Aula 06.mp4",
    fixtureKey: "media.sales.lesson.06",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
  {
    order: 7,
    lessonTitle: "Rapport: Como criar conexão e assumir o controle",
    videoFile: "Aula 07.mp4",
    fixtureKey: "media.sales.lesson.07",
    required: true,
    hasAssessment: true,
    status: "confirmado" as const,
  },
];
