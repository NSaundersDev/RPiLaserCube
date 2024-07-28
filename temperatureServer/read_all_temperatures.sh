#!/bin/bash
printf "$(date '+%T'),""$(smtc 0 read 1),""$(smtc 0 read 2),""$(smtc 0 read 3),""$(smtc 0 read 4),""$(smtc 0 read 5),""$(smtc 0 read 6),""$(smtc 0 read 7),""$(smtc 0 read 8)"
