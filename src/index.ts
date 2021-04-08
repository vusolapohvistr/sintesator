import fs from 'fs';
import lame from 'lame';
import Speaker from 'speaker';
import readline from 'readline';
import _ from 'lodash';
import audioconcat from 'audioconcat';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const availableSounds = new Set(fs.readdirSync('samples').map(x => x.split('.')[0]));

function play(path: string) {
  return new Promise(r => {
    fs.createReadStream(path)
      .pipe(lame.Decoder())
      .on('format', function (format) {
        // @ts-ignore
        this.pipe(new Speaker(format));
      })
      .on('finish', () => {
        r(void 0);
      });
  });
}

function makeSoundSamplePath(sound: string) {
  return `samples\/${sound}.mp3`;
}

function makeSoundPlan(stringToPlay: string): string[] {
  return _.flatten(
    stringToPlay
      .split(' ')
      .map(word => makePlanForWord(word).concat(['space']))
    );
}

function makePlanForWord(word: string): string[] {
  const plan: string[] = [];

  let rightOffset = 0;
  let leftOffset = 0;
  while (leftOffset !== word.length) {
    const subWord = word.slice(leftOffset, word.length - rightOffset);
    if (availableSounds.has(subWord)) {
      plan.push(subWord);
      leftOffset += subWord.length;
      rightOffset = 0;
    } else {
      rightOffset += 1;
    }
    if (rightOffset === word.length) {
      throw new TypeError('Unknown sound');
    }
  }

  return plan;
}

async function playAndWriteText(text: string): Promise<void> {
  const plan = makeSoundPlan(text.toLowerCase());
  const filePaths = plan
    .map(x => makeSoundSamplePath(x));
  for (const soundPath of filePaths) {
    await play(soundPath);
  }
  await writeConcatenatedMp3(filePaths);
}

function writeConcatenatedMp3(filePaths: string[]): Promise<void> {
  return new Promise(r => {
    audioconcat(filePaths)
      .concat('result.mp3')
      .on('start', () => console.log('Uploading result'))
      .on('error', (err, _stdout, stderr) => {
        console.error('Error:', err);
        console.error('ffmpeg stderr:', stderr);
      })
      .on('end', (output) => {
        console.log('Audio created in:', output);
        r();
      });
  });
}

rl.question('Введіть текст щоб його проспівав Шевченко\n', async (text) => {
  await playAndWriteText(text);

  rl.close();
});
