import { listPublicDriveFolder } from "./drive-public";

listPublicDriveFolder("169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt")
  .then((f) => {
    console.log(JSON.stringify(f, null, 2));
    console.log("count:", f.length);
  })
  .catch(console.error);
