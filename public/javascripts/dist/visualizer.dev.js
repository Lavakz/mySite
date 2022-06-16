"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

window.onload = function () {
  var visualizer = null;
  var rendering = false;
  var audioContext = null;
  var sourceNode = null;
  var delayedAudible = null;
  var cycleInterval = null;
  var presets = {};
  var presetKeys = [];
  var presetIndexHist = [];
  var presetIndex = 0;
  var presetCycle = true;
  var presetCycleLength = 15000;
  var presetRandom = true;
  var canvas = document.getElementById('canvas');

  function connectToAudioAnalyzer(sourceNode) {
    if (delayedAudible) {
      delayedAudible.disconnect();
    }

    delayedAudible = audioContext.createDelay();
    delayedAudible.delayTime.value = 0.26;
    sourceNode.connect(delayedAudible);
    delayedAudible.connect(audioContext.destination);
    visualizer.connectAudio(delayedAudible);
  }

  function startRenderer() {
    requestAnimationFrame(function () {
      return startRenderer();
    });
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

  function loadLocalFiles(files) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    audioContext.resume();
    var reader = new FileReader();

    reader.onload = function (event) {
      audioContext.decodeAudioData(event.target.result, function (buf) {
        playBufferSource(buf);
        setTimeout(function () {
          if (files.length > index + 1) {
            loadLocalFiles(files, index + 1);
          } else {
            sourceNode.disconnect();
            sourceNode = null;
            $("#audioSelectWrapper").css('display', 'block');
          }
        }, buf.duration * 1000);
      });
    };

    var file = files[index];
    reader.readAsArrayBuffer(file);
  }

  function nextPreset() {
    var blendTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5.7;
    presetIndexHist.push(presetIndex);
    var numPresets = presetKeys.length;

    if (presetRandom) {
      presetIndex = Math.floor(Math.random() * presetKeys.length);
    } else {
      presetIndex = (presetIndex + 1) % numPresets;
    }

    visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
    $('#presetSelect').val(presetIndex);
  }

  function prevPreset() {
    var blendTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5.7;
    var numPresets = presetKeys.length;

    if (presetIndexHist.length > 0) {
      presetIndex = presetIndexHist.pop();
    } else {
      presetIndex = (presetIndex - 1 + numPresets) % numPresets;
    }

    visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
    $('#presetSelect').val(presetIndex);
  }

  function restartCycleInterval() {
    if (cycleInterval) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }

    if (presetCycle) {
      cycleInterval = setInterval(function () {
        return nextPreset(2.7);
      }, presetCycleLength);
    }
  }

  $(document).keydown(function (e) {
    if (e.which === 32 || e.which === 39) {
      nextPreset();
    } else if (e.which === 8 || e.which === 37) {
      prevPreset();
    } else if (e.which === 72) {
      nextPreset(0);
    }
  });
  $('#presetSelect').change(function (evt) {
    presetIndexHist.push(presetIndex);
    presetIndex = parseInt($('#presetSelect').val());
    visualizer.loadPreset(presets[presetKeys[presetIndex]], 5.7);
  });
  $('#presetCycle').change(function () {
    presetCycle = $('#presetCycle').is(':checked');
    restartCycleInterval();
  });
  $('#presetCycleLength').change(function (evt) {
    presetCycleLength = parseInt($('#presetCycleLength').val() * 1000);
    restartCycleInterval();
  });
  $('#presetRandom').change(function () {
    presetRandom = $('#presetRandom').is(':checked');
  });
  $("#localFileBut").click(function () {
    $("#audioSelectWrapper").css('display', 'none');
    var fileSelector = $('<input type="file" accept="audio/*" multiple />');

    fileSelector[0].onchange = function (event) {
      loadLocalFiles(fileSelector[0].files);
    };

    fileSelector.click();
  });

  function initPlayer() {
    console.log("initPlayer");
    audioContext = new AudioContext();
    presets = {};

    if (window.butterchurnPresets) {
      Object.assign(presets, butterchurnPresets.getPresets());
    }

    if (window.butterchurnPresetsExtra) {
      Object.assign(presets, butterchurnPresetsExtra.getPresets());
    }

    presets = _(presets).toPairs().sortBy(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          k = _ref2[0],
          v = _ref2[1];

      return k.toLowerCase();
    }).fromPairs().value();
    presetKeys = _.keys(presets);
    presetIndex = Math.floor(Math.random() * presetKeys.length);
    var presetSelect = document.getElementById('presetSelect');

    for (var i = 0; i < presetKeys.length; i++) {
      var opt = document.createElement('option');
      opt.innerHTML = presetKeys[i].substring(0, 60) + (presetKeys[i].length > 60 ? '...' : '');
      opt.value = i;
      presetSelect.appendChild(opt);
    }

    visualizer = butterchurn["default"].createVisualizer(audioContext, canvas, {
      width: 800,
      height: 600,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1
    });
    nextPreset(0);
    cycleInterval = setInterval(function () {
      return nextPreset(2.7);
    }, presetCycleLength);
  }

  initPlayer();
};