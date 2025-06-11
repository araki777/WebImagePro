const { exec } = require("child_process");

exec("openapi-typescript http://localhost:8000/openapi.json -o src/types/api.d.ts", (error, stdout) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
});