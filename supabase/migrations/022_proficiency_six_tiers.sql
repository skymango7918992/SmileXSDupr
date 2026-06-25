-- 功法熟練度六階：基礎 → 入門 → 小成 → 入微 → 大成 → 圓滿

alter table technique_progress
  drop constraint if exists technique_progress_proficiency_level_check;

alter table technique_progress
  add constraint technique_progress_proficiency_level_check
  check (
    proficiency_level in (
      'foundation',
      'initiation',
      'minor_success',
      'subtle',
      'major_success',
      'perfection'
    )
  );

alter table technique_progress
  alter column proficiency_level set default 'foundation';

update technique_progress
set proficiency_level = case
  when proficiency_score < 10 then 'foundation'
  when proficiency_score < 25 then 'initiation'
  when proficiency_score < 45 then 'minor_success'
  when proficiency_score < 65 then 'subtle'
  when proficiency_score < 85 then 'major_success'
  else 'perfection'
end;
