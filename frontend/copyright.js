import fs from 'fs';
import path from 'path';

// 1. Tutaj wpisz swój NOWY, docelowy tekst nagłówka
const NAGLOWEK = `// Copyright (c) 2026 Szymon Piera. All rights reserved.
// Wszelkie prawa zastrzeżone.

`;

function przeszukajFolder(katalog) {
  if (!fs.existsSync(katalog)) return;

  const elementy = fs.readdirSync(katalog);

  elementy.forEach((element) => {
    const pelnaSciezka = path.join(katalog, element);
    const statystyki = fs.statSync(pelnaSciezka);

    if (statystyki.isDirectory()) {
      przeszukajFolder(pelnaSciezka);
    } else if (element.endsWith('.ts') || element.endsWith('.tsx')) {
      const zawartosc = fs.readFileSync(pelnaSciezka, 'utf8');

      let oczyszczonyTekst = zawartosc;

      // KROK 1: Czyścimy stare, zepsute komentarze blokowe (/* ... */) z góry pliku
      const blockRegex = /^\s*\/\*[\s\S]*?Copyright[\s\S]*?\*\//gi;
      while (blockRegex.test(oczyszczonyTekst)) {
        oczyszczonyTekst = oczyszczonyTekst.replace(blockRegex, '');
      }

      // KROK 2: Analizujemy linia po linii komentarze jednowierszowe (//)
      const linie = oczyszczonyTekst.split(/\r?\n/);
      const przefiltrowaneLinie = [];
      let wNaglowku = true;

      for (let i = 0; i < linie.length; i++) {
        const linia = linie[i];
        const podcietaLinia = linia.trim();

        // Dopóki jesteśmy na samej górze pliku i widzimy komentarze lub puste linie
        if (wNaglowku && (podcietaLinia.startsWith('//') || podcietaLinia === '')) {
          // Jeśli linia to stary copyright – pomijamy ją (czyli usuwamy)
          if (
            linia.includes('Copyright') || 
            linia.includes('Wszelkie prawa') || 
            linia.includes('rights reserved')
          ) {
            continue;
          }
          // Inne ważne komentarze na górze (np. // @ts-nocheck) zostawiamy w spokoju!
          przefiltrowaneLinie.push(linia);
        } else {
          // Trafiliśmy na pierwszą linię prawdziwego kodu (np. import, export, const) 
          // Kończymy przeszukiwanie nagłówka i przepisujemy resztę pliku 1:1
          wNaglowku = false;
          przefiltrowaneLinie.push(linia);
        }
      }

      // Łączymy kod z powrotem w tekst
      oczyszczonyTekst = przefiltrowaneLinie.join('\n');

      // KROK 3: Składamy plik z NOWYM nagłówkiem
      // .trimStart() usunie zbędne puste linie, które zostały po starym nagłówku
      const finalnyTekst = NAGLOWEK + oczyszczonyTekst.trimStart();
      
      // Zabezpieczenie: Zapisujemy na dysk tylko wtedy, gdy treść rzeczywiście się zmieniła
      if (zawartosc !== finalnyTekst) {
        fs.writeFileSync(pelnaSciezka, finalnyTekst, 'utf8');
        console.log(`🔄 Zaktualizowano nagłówek w: ${element}`);
      } else {
        console.log(`ℹ️ Nagłówek jest już aktualny: ${element}`);
      }
    }
  });
}

const sciezkaSrc = path.join(process.cwd(), 'src');
console.log('🚀 Rozpoczynam bezpieczną aktualizację nagłówków...');
przeszukajFolder(sciezkaSrc);
console.log('✨ Gotowe!');