import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT || 3002;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✨ Yaazhi Boutique Backend API running on http://localhost:${PORT}`);
  console.log(`✨ Network access enabled on 0.0.0.0:${PORT}`);
});

export { server };
export default server;
