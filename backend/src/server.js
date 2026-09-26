require("dotenv").config();
require("./config/db"); // initialise la base + le schéma au démarrage
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Momo Tech API démarrée sur http://localhost:${PORT}`);
});
