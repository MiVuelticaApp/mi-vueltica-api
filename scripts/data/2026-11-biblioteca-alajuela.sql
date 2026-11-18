-- Biblioteca Pública de Alajuela "Miguel Obregón Lizano" (alliance, November 2026)
-- and its Taller de Manualidades Navideñas (7, 8, 14 and 15 December 2026).
--
-- Run once against the production database (MariaDB), for example:
--   mariadb -h <host> -u <user> -p <database> < scripts/data/2026-11-biblioteca-alajuela.sql
-- It is idempotent: running it again creates nothing new. Everything is created PUBLISHED.
-- Times are stored in UTC, like Prisma does: 10:30 a.m. in Costa Rica (-06:00) is 16:30 UTC.

START TRANSACTION;

SET @canton   = (SELECT id FROM Canton WHERE provinceId = 2 AND name = 'Alajuela');
SET @cultura  = (SELECT id FROM Category WHERE name = 'Cultura');
SET @familia  = (SELECT id FROM Category WHERE name = 'Familia');
SET @library  = 'Biblioteca Pública de Alajuela Miguel Obregón Lizano';
SET @workshop = 'Taller de Manualidades Navideñas';

-- Stops here (NOT NULL error) if the canton or a category is missing, instead of inserting bad rows.
INSERT INTO Place (
  id, cantonId, categoryId, sourceId, name, description, latitude, longitude, address,
  openingHours, targetAudience, status, verifiedAt, pricePerPerson,
  audienceEveryone, audienceFamilies, audienceStudents, audienceSeniors, wheelchairAccessible,
  createdAt, updatedAt
)
SELECT
  UUID(), @canton, @cultura, NULL, @library,
  'Biblioteca pública del Sistema Nacional de Bibliotecas (SINABI). Préstamo de libros, sala de lectura y actividades gratuitas para todas las edades.',
  10.021369, -84.214910, 'Costado norte de los Tribunales de Justicia, Alajuela centro',
  NULL, 'EVERYONE', 'PUBLISHED', NOW(3), 0,
  1, 1, 1, 1, 0,
  NOW(3), NOW(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Place WHERE cantonId = @canton AND name = @library);

SET @place = (SELECT id FROM Place WHERE cantonId = @canton AND name = @library LIMIT 1);

CREATE TEMPORARY TABLE workshop_dates (startsAt DATETIME(3) NOT NULL);
INSERT INTO workshop_dates VALUES
  ('2026-12-07 16:30:00.000'),
  ('2026-12-08 16:30:00.000'),
  ('2026-12-14 16:30:00.000'),
  ('2026-12-15 16:30:00.000');

-- With a place, the event has no own location or canton (the API uses the place's).
INSERT INTO Event (
  id, placeId, categoryId, sourceId, title, description, startsAt, endsAt,
  latitude, longitude, address, cantonId, targetAudience, status, pricePerPerson,
  audienceEveryone, audienceFamilies, audienceStudents, audienceSeniors, wheelchairAccessible,
  createdAt, updatedAt
)
SELECT
  UUID(), @place, @familia, NULL, @workshop,
  'Taller gratuito para niñas y niños de 6 a 10 años: ¡vení a crear y compartir la magia de la Navidad! Cupo de 10 personas por sesión. Inscripciones por WhatsApp al 2441 2212.',
  d.startsAt, d.startsAt + INTERVAL 1 HOUR,
  NULL, NULL, NULL, NULL, 'CHILDREN', 'PUBLISHED', 0,
  0, 1, 0, 0, 0,
  NOW(3), NOW(3)
FROM workshop_dates d
WHERE @place IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM Event e WHERE e.placeId = @place AND e.title = @workshop AND e.startsAt = d.startsAt);

DROP TEMPORARY TABLE workshop_dates;

COMMIT;

-- Check: one place and four events.
SELECT p.name, p.status, COUNT(e.id) AS events
FROM Place p LEFT JOIN Event e ON e.placeId = p.id AND e.title = @workshop
WHERE p.id = @place GROUP BY p.id;
