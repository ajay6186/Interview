#!/bin/sh
FIRSTNAME=$(cat /app/conf/FIRSTNAME)
LASTNAME=$(cat /app/conf/LASTNAME)
sed -i "/<body>/a\\<br><center>Hello ${FIRSTNAME} ${LASTNAME}!</center>" /app/index.html
exit 0
