#!/bin/sh
rm addon.zip
zip -r addon.zip . -x ISSUE_TEMPLATE push.sh release.sh .git/\* .gitignore
