#!/usr/bin/env node
/**
 * Parche de @lucide/angular: su plantilla interna usa
 * `track child[1]['key'] ?? $index` para el `@for` que renderiza los
 * <path>/<line>/... de cada icono. El compilador de Angular (confirmado
 * en @angular/core 18.2.14, con un componente de prueba propio sin
 * ninguna dependencia de terceros) genera código roto para cualquier
 * expresión `track` con `??`: la función trackBy se extrae a una
 * constante de módulo que referencia una variable temporal (`tmp_N_0`)
 * que nunca se declara ahí, y revienta en tiempo de ejecución con
 * "ReferenceError: tmp_N_0 is not defined" en cuanto Angular la invoca -
 * es decir, en cuanto se pinta CUALQUIER icono de esta librería, en
 * build de producción (el bug ya está en el output del compilador AOT
 * sin minificar; esbuild no tiene nada que ver).
 *
 * Mientras no haya una versión de Angular o de @lucide/angular sin este
 * bug, este script sustituye `?? $index` por `|| $index` en el bundle
 * ya instalado - mismo resultado práctico para el trackBy (ambos caen a
 * $index cuando falta la key), pero sin el operador que dispara el bug.
 * `patch-package` no vale aquí: el fichero es demasiado grande para que
 * su diff no se quede sin memoria, así que esto corre como postinstall.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'node_modules', '@lucide', 'angular', 'fesm2022', 'lucide-angular.mjs');
const FROM = '?? $index';
const TO = '|| $index';

if (!fs.existsSync(TARGET)) {
  console.warn(`[patch-lucide-angular] ${TARGET} no existe (¿@lucide/angular no instalado?) - nada que parchear.`);
  process.exit(0);
}

const content = fs.readFileSync(TARGET, 'utf8');
const occurrences = content.split(FROM).length - 1;

if (occurrences === 0) {
  if (content.includes(TO)) {
    console.log('[patch-lucide-angular] ya estaba parcheado, nada que hacer.');
  } else {
    console.warn('[patch-lucide-angular] no se encontró el patrón esperado - ¿cambió la librería? Revisa si el bug sigue aplicando.');
  }
  process.exit(0);
}

fs.writeFileSync(TARGET, content.split(FROM).join(TO));
console.log(`[patch-lucide-angular] parcheadas ${occurrences} ocurrencias de "${FROM}" -> "${TO}".`);
