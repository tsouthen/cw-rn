echo "[" > exports.json
find *.svg | sed 's/\.svg$//1' | xargs -I % echo { \"input\": [\"%.svg\" ], \"output\": [ [ \"png/%.png\", \"60:\" ] ] }, >> exports.json
find *.svg | sed 's/\.svg$//1' | xargs -I % echo { \"input\": [\"%.svg\" ], \"output\": [ [ \"png/%@2.png\", \"120:\" ] ] }, >> exports.json
find *.svg | sed 's/\.svg$//1' | xargs -I % echo { \"input\": [\"%.svg\" ], \"output\": [ [ \"png/%@3.png\", \"180:\" ] ] }, >> exports.json
sed '$s/,$//' exports.json >> exports2.json
echo "]" >> exports2.json
rm exports.json
mv exports2.json exports.json
