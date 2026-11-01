import app from "./app";
import ENV from "./core/config/env";

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});