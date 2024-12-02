IFS=

BASE_CODE=$(cat ./client/client.mjs)

REPLACE_CLASS_CODE=`echo $BASE_CODE | sed 's/export class/class/g'`

REPLACE_CONST_CODE=`echo $REPLACE_CLASS_CODE | sed 's/export const/const/g'`

REPLACE_FUNC_CODE=`echo $REPLACE_CONST_CODE | sed 's/export function/function/g'`

echo $REPLACE_FUNC_CODE > ./client/client.cjs

echo "Server starting..."
node server.js
