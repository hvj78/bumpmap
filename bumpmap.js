//################################################
//
// Bump Mapping demo effect in JavaScript
//
// by hvj78 with COVID-19
//
// 2020. november 27-28.
//
//################################################

//----------------------------------
// canvas inicializálása

var canvas = document.getElementById('democanvas');
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var ctx = canvas.getContext('2d');
var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

var startTime;
var futasiIdo = 60000; // msec
var allowAnimation = true;
var stoppedTime = 0; // ekkor lett leállítva az animáció
var timepassedby = 0; // ennyi idő ment el a leállítás alatt.

// fényforrás középpontja:
var lightCenterX, lightCenterY;

// ha mind a lightmap mind a heightmap kész, akkor lehet animálni:
var heightmapReady = false;
var lightmapReady = false;

//-----------------------------------
// készítek egy 256x256-os lightmap-et:

var lightmap = [];
 for (let x=0; x<256; x++) {
   lightmap[x] = []
    for (let y=0; y<256; y++) {

      // a fenyerő a 256x256-os map közepénél 255, a szélénél 0:
      lightmap[x][y]=255-2*Math.sqrt((x-128)*(x-128)+(y-128)*(y-128));
    }
 }
lightmapReady = true;

//------------------------------------
// Heightmap betöltése képből tömbbe:

var heightmap = [];

var img = new Image();
img.crossOrigin = 'anonymous';
img.src = 'hvj-heightmap.png';
img.onload = function() {
  ctx.drawImage(img, 0, 0);
  // a képből készítek egy egyszerű kétdimenziós tömböt, amivel majd későbbiekben dolgozok:
  canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  for (let x=0; x<canvasWidth; x++) {
    heightmap[x] = []
     for (let y=0; y<canvasHeight; y++) {

       heightmap[x][y]=canvasData.data[(x+y*canvasWidth)*4];
     }
  }
 
  //kitakarítom a canvast a betöltés után:
  ctx.clearRect(0,0,canvasWidth,canvasHeight);

  heightmapReady = true;
};

// indítom az animációt:
window.requestAnimationFrame(effect);

//-------------------------------------
// pixelrajzoló függvény:

function drawPixel (x, y, r, g, b, a) {

  let index = (x + y * canvasWidth) * 4;

  canvasData.data[index + 0] = r;
  canvasData.data[index + 1] = g;
  canvasData.data[index + 2] = b;
  canvasData.data[index + 3] = a;
}



//----------------------------------------------------
// main effect function, ami kirajzolja a képkockát...

function effect(thisTime) {

  // kezeljük az időt, mennyi ideje megy ez az animáció:
  if (startTime === undefined) {
    startTime = thisTime;
  }
  if (stoppedTime>0) {
    // le voltam állítva, most indultam újra.
    // a leállás alatt eltelt időt hozzáteszem a timepassedby változóhoz:
    timepassedby += thisTime-stoppedTime;
    stoppedTime = 0;
  }
  const ellapsedTime = thisTime - startTime - timepassedby;

  // mozgatom a fényforrást
  // egyszerű kör mentén mozgatom egyelőre a fényforrást körben
  // a kör sugara a canvas kisebb méretének a harmada:
  const sugar = Math.min(canvasWidth, canvasHeight)/3;
  // a körvonalon az elfordulás szöge az idő
  // egy teljes kör megtételének ideje:
  const turnAroundTime = 5000; // msec

  const radian = ellapsedTime/turnAroundTime*2*Math.PI;

  lightCenterX = Math.cos(radian)*sugar+canvasWidth/2;
  lightCenterY = Math.sin(radian)*sugar+canvasHeight/2;

  if (heightmapReady && lightmapReady) {

    for (let x=1;x<canvasWidth-1;x++) {
      for (let y=1;y<canvasHeight-1;y++) {

        let pos = (x+y*canvasWidth)*4;

        let deltax = heightmap[x][y]-heightmap[x-1][y];
        let deltay = heightmap[x][y]-heightmap[x][y-1];
        let xcorr, ycorr;

        // honnan jön a fény?

        const rate = 2;

        if (lightCenterX > x) {
          // ha pozitív a deltax, akkor emelkedünk, tehát itt sötét van
          // tehát a lightmap-en a középtől távolabbról veszek mintát:
          xcorr = Math.floor(deltax/rate);
        }
        else {
          // ha pozitív a deltax, akkor emelkedünk, és itt most világos van
          // a lightmap közepéhez közelebbről veszek mintát.
          xcorr = -1 * Math.floor(deltax/rate);
        }
        if (lightCenterY > y) {
          // ha pozitív a deltay, akkor emelkedünk és itt sötét van.
          ycorr = Math.floor(deltay/rate);          
        }
        else {
          // ha pozitív a deltay, akkor emelkedünk és itt világos van.
          ycorr = -1 * Math.floor(deltay/rate);          
        }

        let lightmapX = Math.floor(Math.min((Math.abs(x-lightCenterX)+xcorr),127) + 128);
        let lightmapY = Math.floor(Math.min((Math.abs(y-lightCenterY)+ycorr),127) + 128);

        let szin = lightmap[lightmapX][lightmapY];

        drawPixel(x,y,szin,szin,szin,255);
      }
    }
    // frissítem a canvas-t:
    ctx.putImageData(canvasData, 0, 0);
  }

    // jöhet majd a következő képkocka, ha kell még:
    if (allowAnimation) {
      window.requestAnimationFrame(effect);
    } else {
      stoppedTime = thisTime;
    }
}
