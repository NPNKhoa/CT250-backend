import { readFile } from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function compileTemplate(templateName, data) {
  const filePath = path.join(__dirname, `../templates/${templateName}.hbs`);

  try {
    const source = await readFile(filePath, 'utf-8');

    const template = handlebars.compile(source);

    return template(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}
