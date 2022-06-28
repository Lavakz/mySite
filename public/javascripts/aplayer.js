const ap = new APlayer({
    container: document.getElementById('aplayer'),
    mini: false,
    autoplay: false,
    theme: '#230660',
    loop: 'all',
    order: 'random',
    preload: 'auto',
    volume: 0.7,
    mutex: true,
    listFolded: false,
    listMaxHeight: 1000,
    audio: []
});

window.onload = (function () {
    var visualizer = null;
    var rendering = false;
    var audioContext = null;
    var sourceNode = null;
    var delayedAudible = null;
    var canvas = document.getElementById('canvas');
    var gl = canvas.getContext('webgl2');

    function connectToAudioAnalyzer(sourceNode) {
      if (delayedAudible) {
        delayedAudible.disconnect();
      }
      delayedAudible = audioContext.createDelay();
      delayedAudible.delayTime.value = 0.1;
      sourceNode.connect(delayedAudible)
      //delayedAudible.connect(audioContext.destination);
      visualizer.connectAudio(delayedAudible);
    }

    function startRenderer() {
      requestAnimationFrame(() => startRenderer());
      visualizer.render();
    }

    function playBufferSource(buffer) {
      if (!rendering) {
        rendering = true;
        startRenderer();
      }
      if (sourceNode) {
        sourceNode.disconnect();
      }
      sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      connectToAudioAnalyzer(sourceNode);
      sourceNode.start(0);
    }
    function loadLocalFiles(files, index = 0) {
      audioContext.resume();
      var reader = new FileReader();
      reader.onload = (event) => {
        audioContext.decodeAudioData(
          event.target.result,
          (buf) => {
            playBufferSource(buf);
            setTimeout(() => {
              if (files.length > index + 1) {
                loadLocalFiles(files, index + 1);
              } else {
                sourceNode.disconnect();
                sourceNode = null;
                $("#audioSelectWrapper").css('display', 'block');
              }
            }, buf.duration * 1000);
          }
        );
      };
      var file = files[index];
      reader.readAsArrayBuffer(file);
    }

    function loadHostedFile(src){
        var reader = new FileReader();
        reader.onload = (event) => {
            audioContext.decodeAudioData(
                event.target.result,
                (buf) => {playBufferSource(buf);}
            );
        }   
        fetch(src)
            .then(res => res.blob())
            .then(blob => {reader.readAsArrayBuffer(blob);})
    }

    function initPlayer() {
        addSongs(filenames);
        audioContext = new AudioContext();
        presets = {};
        if (window.butterchurnPresets) {
          Object.assign(presets, butterchurnPresets.getPresets());
        }
        if (window.butterchurnPresetsExtra) {
          Object.assign(presets, butterchurnPresetsExtra.getPresets());
        }
        presets = _(presets).toPairs().sortBy(([k, v]) => k.toLowerCase()).fromPairs().value();
        presetKeys = _.keys(presets);
        presetIndex = Math.floor(Math.random() * presetKeys.length);
        visualizer = butterchurn.default.createVisualizer(audioContext, canvas, {
          width: canvas.width,
          height: canvas.height,
          pixelRatio: window.devicePixelRatio || 1,
          textureRatio: 1,
        });
        setPreset(10);
    }

    function addSongs(filenames) {
      filenames.forEach((file) => {
        ap.list.add([{
          name: file.substring(0, file.length-4),
          artist: ' ',
          url: '/music/' + file,
          cover: 'cover.jpg',
          theme: '#230660'
        }]);
      });
    }

    function setPreset(currentSong) {
      presetIndex = 10;
      currentSong = currentSong.toString();
      if (currentSong.includes("Amoeba")) presetIndex = 1; 
      if (currentSong.includes("Cyclomachine")) presetIndex = 2; 
      if (currentSong.includes("Darkwraith")) presetIndex = 151; 
      if (currentSong.includes("Daze")) presetIndex = 4; 
      if (currentSong.includes("Deep")) presetIndex = 7; 
      if (currentSong.includes("Harp")) presetIndex = 147; 
      if (currentSong.includes("Protozoa")) presetIndex = 160; 
      console.log(presetKeys);
      //presets.forEach((presetKeys) => {
      //})
      visualizer.loadPreset(presets[presetKeys[presetIndex]], 0.0);
    }

    ap.on('play', function () {
      currentSong = ap.audio.src;
      setPreset(currentSong)
      loadHostedFile(currentSong);
    });

    ap.on('pause', function () {
      gl.viewport(0, 0,
        gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0.0, 0.5, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });

    initPlayer()
});
