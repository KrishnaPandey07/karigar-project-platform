const net = require('net');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.resolve(process.env.USERPROFILE || 'c:/Users/24f20', 'Desktop');
const cloudflaredPath = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // port in use
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n===================================================================');
  console.log('    🪔 कारीगर (Karigar) - भारत का विश्वसनीय कारीगर व सेवा मंच');
  console.log('===================================================================\n');

  // 1. Check & start PostgreSQL (5432)
  process.stdout.write('[1/4] डेटाबेस (PostgreSQL :5432) की जांच... ');
  let dbActive = await checkPort(5432);
  if (dbActive) {
    console.log('पहले से चालू है (Already Active) ✓');
  } else {
    console.log('प्रारंभ किया जा रहा है...');
    spawn('cmd.exe', ['/c', 'node', 'scripts/start-db.js'], {
      cwd: path.join(rootDir, 'backend'),
      detached: true,
      stdio: 'ignore',
    }).unref();
    for (let i = 0; i < 15; i++) {
      await delay(1000);
      if (await checkPort(5432)) {
        dbActive = true;
        break;
      }
    }
    console.log(dbActive ? 'डेटाबेस सफलतापूर्वक चालू हुआ ✓' : 'डेटाबेस चालू हो रहा है (कृपया प्रतीक्षा करें)...');
  }

  // 2. Check & start Backend (5000)
  process.stdout.write('[2/4] बैकएंड API (:5000) की जांच... ');
  let backendActive = await checkPort(5000);
  if (backendActive) {
    console.log('पहले से चालू है (Already Active) ✓');
  } else {
    console.log('प्रारंभ किया जा रहा है...');
    spawn('cmd.exe', ['/c', 'npm', 'start'], {
      cwd: path.join(rootDir, 'backend'),
      detached: true,
      stdio: 'ignore',
    }).unref();
    for (let i = 0; i < 15; i++) {
      await delay(1000);
      if (await checkPort(5000)) {
        backendActive = true;
        break;
      }
    }
    console.log(backendActive ? 'बैकएंड सफलतापूर्वक चालू हुआ ✓' : 'बैकएंड चालू हो रहा है...');
  }

  // 3. Check & start Frontend (5173)
  process.stdout.write('[3/4] फ़्रंटएंड वेब ऐप (:5173) की जांच... ');
  let frontendActive = await checkPort(5173);
  if (frontendActive) {
    console.log('पहले से चालू है (Already Active) ✓');
  } else {
    console.log('प्रारंभ किया जा रहा है...');
    spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: path.join(rootDir, 'frontend'),
      detached: true,
      stdio: 'ignore',
    }).unref();
    for (let i = 0; i < 15; i++) {
      await delay(1000);
      if (await checkPort(5173)) {
        frontendActive = true;
        break;
      }
    }
    console.log(frontendActive ? 'फ़्रंटएंड सफलतापूर्वक चालू हुआ ✓' : 'फ़्रंटएंड चालू हो रहा है...');
  }

  // 4. Start Cloudflare Tunnel with auto-reconnection
  function startTunnel() {
    console.log('\n[4/4] 🌐 24/7 पब्लिक ऑनलाइन लिंक (Cloudflare Tunnel) जोड़ा जा रहा है...');

    try {
      exec('taskkill /f /im cloudflared.exe', () => {});
    } catch (e) {}

    setTimeout(() => {
      const tunnelProcess = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:5173']);
      let liveUrl = null;

      const onData = (data) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !liveUrl) {
          liveUrl = match[0];
          onUrlFound(liveUrl);
        }
      };

      tunnelProcess.stdout.on('data', onData);
      tunnelProcess.stderr.on('data', onData);

      tunnelProcess.on('close', (code) => {
        console.log(`\n⚠️ टनल संपर्क टूटा (Code: ${code})। 5 सेकंड में स्वतः पुनः जोड़ा जा रहा है (Auto-reconnecting)...`);
        setTimeout(startTunnel, 5000);
      });
    }, 1500);
  }

  function onUrlFound(url) {
    console.log('\n' + '='.repeat(67));
    console.log('  🎉 आपका कारीगर (Karigar) 24/7 ऑनलाइन लाइव लिंक तैयार है!');
    console.log('  👉 ' + url);
    console.log('='.repeat(67) + '\n');
    console.log('✨ महत्वपूर्ण सूचना (Important):');
    console.log('- आप Antigravity को सुरक्षित रूप से बंद कर सकते हैं!');
    console.log('- यह लिंक इंटरनेट पर तब तक काम करता रहेगा जब तक यह विंडो खुली है या बैकग्राउंड में चल रहा है।');
    console.log('- आपके डेस्कटॉप पर "कारीगर (Karigar) Live Website" शॉर्टकट और लिंक फ़ाइल बना दी गई है।\n');

    // 1. Write text file on Desktop
    try {
      const txtPath = path.join(desktopDir, 'KARIGAR_LIVE_LINK.txt');
      fs.writeFileSync(
        txtPath,
        `🪔 कारीगर (Karigar) - भारत का विश्वसनीय कारीगर व सेवा मंच\n\nऑनलाइन लाइव लिंक (Online Live URL):\n${url}\n\nयह लिंक मोबाइल, टैबलेट या किसी भी कंप्यूटर के ब्राउज़र में तुरंत खुलता है।\n`,
        'utf8'
      );
    } catch (e) {}

    // 2. Write Windows .url Internet Shortcut on Desktop
    try {
      const urlShortcutPath = path.join(desktopDir, 'कारीगर (Karigar) Live Website.url');
      fs.writeFileSync(
        urlShortcutPath,
        `[InternetShortcut]\nURL=${url}\nIconIndex=0\n`,
        'utf8'
      );
    } catch (e) {}

    // 3. Open browser automatically
    console.log('ब्राउज़र में खोला जा रहा है...');
    exec(`start "" "${url}"`);
  }

  startTunnel();
}

main().catch(console.error);
