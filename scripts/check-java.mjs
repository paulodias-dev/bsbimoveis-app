import { spawnSync } from 'node:child_process';

const REQUIRED_JAVA_MAJOR = 17;
const executable = process.platform === 'win32' ? 'java.exe' : 'java';
const result = spawnSync(executable, ['-version'], {
  encoding: 'utf8',
  env: process.env,
});

if (result.error) {
  console.error('\n❌ Java não foi encontrado no PATH.');
  console.error('Instale o JDK 17 e configure JAVA_HOME antes de gerar o app Android.\n');
  process.exit(1);
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
const versionMatch = output.match(/version\s+"(?:1\.)?(\d+)(?:[._][^\"]*)?"/i);
const major = versionMatch ? Number.parseInt(versionMatch[1], 10) : null;

if (!major) {
  console.error('\n❌ Não foi possível identificar a versão do Java.');
  console.error(output || 'Saída vazia de java -version');
  process.exit(1);
}

if (major !== REQUIRED_JAVA_MAJOR) {
  console.error(`\n❌ JDK incompatível: Java ${major} detectado.`);
  console.error(`Este projeto deve executar o Gradle com JDK ${REQUIRED_JAVA_MAJOR}.`);
  console.error(`JAVA_HOME atual: ${process.env.JAVA_HOME || '(não definido)'}`);
  console.error('\nLinux/Ubuntu, para a sessão atual:');
  console.error('  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64');
  console.error('  export PATH="$JAVA_HOME/bin:$PATH"');
  console.error('  hash -r');
  console.error('\nDepois execute:');
  console.error('  npm run java:check');
  console.error('  npm run android\n');
  process.exit(1);
}

console.log(`✅ Java ${major} detectado. Ambiente Android compatível.`);
console.log(`JAVA_HOME: ${process.env.JAVA_HOME || '(resolvido pelo PATH)'}`);
