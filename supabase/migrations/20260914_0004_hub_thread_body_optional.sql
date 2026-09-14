-- HubThreads: the post body ("question") is optional — the composer labels it
-- "(optional)", POST /api/hub-threads accepts an empty string, and the feed,
-- detail and approval pages all render it conditionally. The original
-- HubThreads_question_check rejected empty bodies, so every title-only post
-- failed with a 500 "Failed to submit post." Keep only the length cap the API
-- already enforces.

alter table "HubThreads" drop constraint if exists "HubThreads_question_check";
alter table "HubThreads"
  add constraint "HubThreads_question_check" check (char_length(question) <= 2000);
