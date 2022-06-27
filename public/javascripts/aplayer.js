const ap = new APlayer({
    container: document.getElementById('aplayer'),
    mini: false,
    autoplay: false,
    theme: '#FADFA3',
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
    function connectToAudioAnalyzer(sourceNode) {
      if (delayedAudible) {
        delayedAudible.disconnect();
      }
      delayedAudible = audioContext.createDelay();
      delayedAudible.delayTime.value = 0.26;
      sourceNode.connect(delayedAudible)
      delayedAudible.connect(audioContext.destination);
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
          pixelRatio: window.devicePixelRatio || 1,
          textureRatio: 1,
        });
        setPreset(10);
    }

    function setPreset(presetIndex) {
        visualizer.loadPreset(presets[presetKeys[presetIndex]], 0.0);
    }

    function addSongs(filenames) {
      filenames.forEach((file) => {
        ap.list.add([{
          name: file.substring(0, file.length-4),
          artist: ' ',
          url: '/music/' + file,
          cover: 'cover.jpg',
          theme: '#ebd0c2'
        }]);
      });
    }

    ap.on('play', function () {
        ap.pause()
        loadHostedFile(ap.audio.src);
    });

    initPlayer()
});
