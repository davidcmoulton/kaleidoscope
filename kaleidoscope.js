(function (window, document, undefined) {
  "use strict";
  var SIDELENGTH = window.innerHeight > window.innerWidth ? window.innerWidth :
                                                            window.innerHeight,

    MAXDRAWLENGTH = SIDELENGTH,
    CANVASCENTRE = MAXDRAWLENGTH / 2,
    DEFAULTMARKSIZE = 5,
    DEFAULTCOLOR = '#86801d',
    DEFAULTNUMSECTORS = 4,
    DEFAULTROTATION = 0,
    DEFAULTSETTINGS = {
      color: DEFAULTCOLOR,
      size: DEFAULTMARKSIZE,
      numSectors: DEFAULTNUMSECTORS,
      rotation: DEFAULTROTATION
    },
    settings = DEFAULTSETTINGS,
    settingSizeDisplayEl,
    settingSectorCountDisplayEl,
    controlRotationDisplayEl,
    currentRotation = 0,
    canvas,
    context,
    isAnimationStarted = false;

    /**
     * Create element with specified attributes.
     * 
     * @param name Name of the element to make
     * @param id The id to give the element
     * @param classes Array of classes to give the element
     * @param attrs Array of addtional attributes to give the element
     * @param txtContent Text to insert directly inside the element
     */
    function makeElement(name, id, classes, attrs, txtContent) {
      var el = null,
        attrName = '';
      try {
        el = document.createElement(name); 
      } catch (e) { /* E.g. name is not a string. */ }
      if (!!id && typeof id === 'string') {
        el.id = id;
      }
      if (!!classes && classes.length > 0) {
        if (Array.isArray(classes)) {
          el.classList.add(classes.join(' '));
        } else if (typeof classes === 'string') {
          el.classList.add(classes);
        }
      }
      if (Array.isArray(attrs)) {
        attrs.forEach(function (attr) {
          attrName = Object.keys(attr)[0];
          el.setAttribute(attrName, attr[attrName]);
        });
      }
      if (typeof txtContent === 'string' && txtContent.length > 0) {
        el.appendChild(document.createTextNode(txtContent));
      }
      return el;
    }
      
  function createGallery() {
    var gallery = document.createElement('OL'),
      unavailableWidth = 0,
      settingsStyles = window.getComputedStyle(document.querySelector('.settings')),
      canvasStyles = window.getComputedStyle(document.querySelector('.kaleidoscope')),
      unavailableWidth = null;
    gallery.id = 'gallery';
    gallery.classList.add('gallery');
    // Calculate width available to gallery.
    unavailableWidth = parseFloat(settingsStyles.width) + 
                       parseFloat(settingsStyles.marginLeft) + 
                       parseFloat(settingsStyles.marginRight) + 
                       parseFloat(canvasStyles.width) + 
                       parseFloat(canvasStyles.marginLeft) +
                       parseFloat(canvasStyles.marginRight);
    gallery.style.width = 'calc(100% - ' + unavailableWidth + 'px)';
    document.querySelector('body').appendChild(gallery);
    restoreGalleryItems(gallery);
  }
  
  
  function createControls(anchor) {
    var parent = anchor instanceof HTMLElement ? anchor :
                                                 document.querySelector('body'),
    form = makeElement('form', 'settings', ['settings'], [ {'action': '#'} ]),
    labelColor = makeElement('label', '', '', [{'for': 'settingColor'}], 'Colour: '),
    inptColor = makeElement('input', 'settingColor', '', [{'type': 'color'}, {'placeholder': '#rrggbb'}]),
    labelSize = makeElement('label', '', '', [{'for': 'settingSize'}], 'Size: '),
    inptSize = makeElement('input', 'settingSize', '', [{'type': 'range'}, {'min': '1'}, 
                                                         {'max': '15', 'value': '5'}]),
    outptSize = makeElement('output', 'outputSize', 'output'),
    labelSectors = makeElement('label', '', '', [{'for': 'settingSectorCount'}], '# Sectors: '),
    inptSectors = makeElement('input', 'settingSectorCount', '', [{'type': 'range'}, {'min': '2'}, 
                                                         {'max': '8', 'value': '4'}]),
    outptSectors = makeElement('output', 'outputSectorCount', 'output'),
    labelRotation = makeElement('label', '', '', [{'for': 'controlRotation'}], 'Rotation: '),
    inptRotation = makeElement('input', 'controlRotation', '', [{'type': 'range'}, {'min': '-5'}, 
                                                         {'max': '5', 'value': '0'}]),
    outptRotation = makeElement('output', 'outputRotation', 'output'),
    buttonWrapper1 = makeElement('div', '', ['button-wrapper']),
    btnSnapshot = makeElement('button', 'controlSnapshot', ['button'], [], 'Snapshot'),
    btnEraseGlry = makeElement('button', 'controlEraseGallery', ['button'], [], 'Erase gallery'),
    buttonWrapper2 = makeElement('div', '', ['button-wrapper']),
    btnResetStage = makeElement('button', 'controlReset', ['button'], [], 'Clear stage');
    
    form.appendChild(labelColor);
    form.appendChild(inptColor);
    form.appendChild(labelSize);
    form.appendChild(inptSize);
    form.appendChild(outptSize);
    form.appendChild(labelSectors);
    form.appendChild(inptSectors);
    form.appendChild(outptSectors);
    form.appendChild(labelRotation);
    form.appendChild(inptRotation);
    form.appendChild(outptRotation);
    buttonWrapper1.appendChild(btnSnapshot);
    buttonWrapper1.appendChild(btnEraseGlry);
    form.appendChild(buttonWrapper1);
    buttonWrapper2.appendChild(btnResetStage);
    form.appendChild(buttonWrapper2);
    parent.appendChild(form);
    
    settingSizeDisplayEl = document.querySelector('#outputSize');
    settingSectorCountDisplayEl = document.querySelector('#outputSectorCount');
    controlRotationDisplayEl = document.querySelector('#outputRotation');

  }
  
  // Add canvas element and a wrapping div to the DOM, returning the canvas.
  function createCanvas(document) {
    var canvas,
      fallbackMsg = "This drawing toy requires canvas to be supported.",
      wrapper = makeElement('div', '', ['kaleidoscope-wrapper']);
    canvas = makeElement('canvas', 'kaleidoscope', ['kaleidoscope'], [
                                                        { 'height': SIDELENGTH },
                                                        { 'width': SIDELENGTH }],
                                                    fallbackMsg);
    canvas.style.height = SIDELENGTH + 'px';
    canvas.style.width = SIDELENGTH + 'px';
    wrapper.appendChild(canvas);
    document.querySelector('body').appendChild(wrapper);
    return canvas;
  }
    
  // Facilitates saving snapshots.
  function createOffscreenCanvas() {
    var osCanvas = document.createElement('CANVAS');
    osCanvas.classList.add('offscreen');
    osCanvas.width = 200;
    osCanvas.height = 200;
    document.querySelector('body').appendChild(osCanvas);
  }
  
  function initialiseSettings(settings) {
    var inputSize = document.querySelector('#settingSize'),
      outputSize = document.querySelector('#outputSize'),
      inputSectorCount = document.querySelector('#settingSectorCount'),
      outputSectorCount = document.querySelector('#outputSectorCount'),
      inputRotation = document.querySelector('#controlRotation'),
      outputRotation = document.querySelector('#outputRotation');

    inputSize.value = settings.size;
    outputSize.value = settings.size;
    inputSectorCount.value = settings.numSectors;
    outputSectorCount.value = settings.numSectors;
    inputRotation.value = settings.rotation;
    outputRotation.value = settings.rotation;    
    document.querySelector('#settingColor').value = settings.color;
  }
  
  // Draw black bkgnd & white circle.
  function initialiseStage(ctx, settings) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SIDELENGTH, SIDELENGTH);
    ctx.moveTo(SIDELENGTH, CANVASCENTRE);
    ctx.fillStyle = '#ffffff';
    ctx.arc(CANVASCENTRE, CANVASCENTRE, SIDELENGTH / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    ctx.clip();
    initialiseSettings(settings);
  }
  
  // Returns canvas {x,y} coords converted from DOM {x,y} coords.
  // FIX: Doesn't work correctly when canvas itself has padding.
  function convertViewport2CanvasCoords(domCoords, canvas) {
    var bBox = canvas.getBoundingClientRect(),
      canvasCoords = {},
      paddingX = parseFloat(window.getComputedStyle(canvas).paddingLeft),
      paddingY = parseFloat(window.getComputedStyle(canvas).paddingTop);
    canvasCoords.x = domCoords.x - bBox.left - paddingX;
    canvasCoords.y = domCoords.y - bBox.top - paddingY;
    return canvasCoords;
  }

  // Convert cartesian coordinates to polar coordinates.
  function cartesianToPolar(x, y) {
    return { r: Math.sqrt(x*x+y*y), theta: Math.atan2(y,x) };
  }

  // Convert cartesian coordinates to polar coordinates.
  function polarToCartesian(r, theta) {
    return { x: r*Math.cos(theta), y: r*Math.sin(theta) };
  }

  // Convert coord from canvas coord system, to having origin at centre of 
  // the stage.
  function canvasToCircOrigin(canvX, canvY) {
    var circX = canvX - CANVASCENTRE,
      circY = (canvY - CANVASCENTRE) * -1;
    return { x: circX, y: circY };
  }

  // Convert coord from being relative to the centre of the stage, to being
  // in the canvas coordinate system.
  function circOriginToCanvas(circX, circY) {
    var canvX = circX + CANVASCENTRE,
      canvY = circY * -1 + CANVASCENTRE;
    return { x: canvX, y: canvY };
  }
  
  function draw(event) {
    var canvasCoords = convertViewport2CanvasCoords({x: event.clientX, y: event.clientY}, 
                                                    event.target),
      ctx = event.target.getContext('2d');
    if (!!ctx) {
      mirror(canvasCoords.x, canvasCoords.y, ctx);
    }
  }
  
  function stopDrawing(event) {
    var canvas =  event.target.nodeName === 'CANVAS' ? event.target : null;
    if (canvas) {
      canvas.removeEventListener('mousemove', draw, false);
      canvas.removeEventListener('mouseup', stopDrawing, false);
      canvas.style.cursor = 'default';

    }
  }

  function startDrawing(event) {
    var canvas =  event.target.nodeName === 'CANVAS' ? event.target : null;
    if (!!canvas) {
      canvas.addEventListener('mousemove', draw, false);
      canvas.addEventListener('mouseup', stopDrawing, false);
      canvas.style.cursor = 'crosshair';
      draw(event);
    }
  }
    
  function getSettings() {
      return settings;
    }
  
  function updateSetting(setting) {
    var key = Object.keys(setting)[0];
    settings[key] = setting[key];
  }
  
  function makeMark(x, y, ctx, settings) {
    ctx.fillStyle = settings.color;
    ctx.beginPath();
    ctx.arc(x, y, settings.size, 0, 2 * Math.PI);
    ctx.fill();
  }

  function mirror(x, y, ctx) {
    var settings = getSettings(),
      numToDraw = settings.numSectors,
      // How much to rotate each mirror.
      step = (2 * Math.PI) / numToDraw,
      circCart,
      polar,
      newTheta,
      newCanvCart;
    ctx.save();
    makeMark(x, y, ctx, settings);
    numToDraw -=1;
    while (numToDraw > 0) {
      // Convert coords from origin at top left, to origin at centre stage.
      circCart = canvasToCircOrigin(x, y);
      //Convert cartesian to polar.
      polar = cartesianToPolar(circCart.x, circCart.y);
      // Increment theta by amount to next mirror point.
      newTheta = polar.theta + step;
      // Convert polar with updated theta to cartesian coordinates.
      circCart = polarToCartesian(polar.r, newTheta);
      // Convert coords from origin at centre stage to origin at top left.
      newCanvCart = circOriginToCanvas(circCart.x, circCart.y);
      // Update x,y with new values.
      x = newCanvCart.x;
      y = newCanvCart.y;
      makeMark(x, y, ctx, settings);
      numToDraw -= 1;
    }
    ctx.restore();
  }
  
  function rotate() {
    var animate = function animate() {
      var newRotation,
        velocity = document.querySelector('#controlRotation').value;
      if (velocity !== '0') {
        newRotation = 2 * Math.sqrt(velocity * velocity) + currentRotation;
        currentRotation = newRotation;
        if (velocity < 0) {
          canvas.style.transform = 'rotate(-' + currentRotation + 'deg)';
          
        } else if (velocity > 0) {
          canvas.style.transform = 'rotate(' + currentRotation + 'deg)';
        }
      }
      window.requestAnimationFrame(animate);
    };
    // Kick off animation.
    if (!isAnimationStarted) {
      animate();
      isAnimationStarted = true;
    }
  }
  
  function showSnapshot(stageCanvas) {
    // TODO: Rotate snapshot the same as the current rotation to include rotation
    //  in snapshot.
    var gallery = document.querySelector('#gallery'),
      galleryItem = document.createElement('LI'),
      galleryImg = document.createElement('IMG'),
      firstItem = gallery.childNodes[0],
      osCanvas = document.querySelector('canvas.offscreen');
    // Scale kaleidoscope to 200x200 for snapshot image.
    osCanvas.getContext('2d').drawImage(stageCanvas, 0, 0, 200, 200);
    galleryImg.src = osCanvas.toDataURL();
    galleryImg.alt = 'Gallery image';
    galleryImg.classList.add('gallery-image');
    galleryItem.classList.add('gallery-item');
    galleryItem.appendChild(galleryImg);
    if (!!firstItem) {
      gallery.insertBefore(galleryItem, firstItem);
    } else {
      gallery.appendChild(galleryItem);
    }
    saveSnapshot(galleryImg.src);
  }
  
  function saveSnapshot(img) {
    var galleryStorage = JSON.parse(localStorage.getItem('gallery')) || [];
    galleryStorage.unshift(img);
    localStorage.setItem('gallery', JSON.stringify(galleryStorage));
  }
  
  function restoreGalleryItems(galleryEl) {
    var galleryStorage = JSON.parse(localStorage.getItem('gallery'))   || [];
    galleryStorage.forEach(function(item) {
      var liEl = document.createElement('LI'),
        imgEl = document.createElement('IMG');
      liEl.classList.add('gallery-item');
      imgEl.classList.add('gallery-image');
      imgEl.src = item;
      imgEl.alt = 'Gallery image';
      liEl.appendChild(imgEl);
      galleryEl.appendChild(liEl);
    });
  }
  
  function eraseGallery() {
    localStorage.setItem('gallery', JSON.stringify([]));
    document.querySelector('#gallery').innerHTML = '';
  }
    
  function update (event) {
    var target = event.target,
      targetId = target.id;
    switch(targetId) {
      case 'settingColor':
        updateSetting({color: target.value});
        break;
      case 'settingSize':
        updateSetting({size: target.value});
        settingSizeDisplayEl.value = target.value;
        break;
      case 'settingSectorCount':
        updateSetting({numSectors: target.value});
        settingSectorCountDisplayEl.value = target.value;
        break;
      case 'controlRotation':
        updateSetting({rotation: target.value});
        controlRotationDisplayEl.value = target.value;
        if (target.value === '0') {
          canvas.style.transform = 'none';
        }
        rotate();
        break;
      case 'controlSnapshot':
        showSnapshot(canvas);
        break;
      case 'controlEraseGallery':
        eraseGallery();
        break;
      case 'controlReset':
        context.save();
        context.fillStyle = '#ffffff';
        context.rect(0, 0, SIDELENGTH, SIDELENGTH);
        context.fill();
        context.restore();
        document.querySelector('#controlRotation').value = 0;
        controlRotationDisplayEl.value = document.querySelector('#controlRotation').value;
        canvas.style.transform = 'none';
        break;
      default:
        break;
    }  
  }
  
  createControls();
  document.querySelector('.settings').
                           addEventListener('change', update, false);
  [].forEach.call(document.querySelectorAll('.button-wrapper'), function (itm) {
    itm.addEventListener('click', update, false);
  });
  canvas = createCanvas(document);
  createOffscreenCanvas();
  createGallery();
  context = canvas.getContext('2d');
      initialiseStage(context, settings);
  canvas.addEventListener('mousedown', startDrawing, false);

}(window, window.document));
