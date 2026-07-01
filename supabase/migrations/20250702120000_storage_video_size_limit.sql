-- Aumenta limite do bucket learning-videos para vídeos de curso (até 5GB por objeto)
UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'learning-videos';
