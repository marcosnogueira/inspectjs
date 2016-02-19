(function(window){
  var inspectSettings = {
    borderColor: '#000',
    borderWidth: 2,
    freezeOnClick: true,
    zIndex: 99999999,
    ids: {
      borderTop: '_inspectjs-overlay-top',
      borderRight: '_inspectjs-overlay-right',
      borderBottom: '_inspectjs-overlay-bottom',
      borderLeft: '_inspectjs-overlay-left',
      background: '_inspectjs-overlay-background'
    },
    onSelectElement: function(){},
    onFreeze: function(){},
    onUnfreeze: function(){}
  }

  var isFreezed = false;
  var currentTarget;
  var currentTargetMetrics;

  function removeElement(element){
    if(element) element.parentNode.removeChild(element);
  }

  function getOffset(el) {
    el = el.getBoundingClientRect();
    return {
      left: el.left + window.scrollX,
      top: el.top + window.scrollY
    }
  }

  function getCursorPosition(event) {
    return {
      x: event.pageX,
      y: event.pageY
    }
  }

  function getPath(node) {
    var path;
    while (node) {
      var realNode = node, name = realNode.localName;
      if (!name) break;

      name = name.toLowerCase();
      if (realNode.id) {
        // As soon as an id is found, there's no need to specify more.
        return name + '#' + realNode.id + (path ? '>' + path : '');
      } else if (realNode.className) {
        name += '.' + realNode.className.split(/\s+/).join('.');
      }

      var parent = node.parentNode, siblings = $(parent).children(name);
      if (siblings.length > 1) name += ':eq(' + siblings.index(node) + ')';
      path = name + (path ? '>' + path : '');

      node = parent;
    }

    return path;
  }

  function addEvent(obj, type, fn) {
    if (obj.attachEvent) {
      obj["e" + type + fn] = fn;
      obj[type + fn] = function() {
        return obj["e" + type + fn](window.event);
      };
      return obj.attachEvent("on" + type, obj[type + fn]);
    } else {
      return obj.addEventListener(type, fn, false);
    }
  }

  function extend(destination, source) {
    var property;
    for (property in source) {
      if (source[property] && source[property].constructor && source[property].constructor === Object) {
        destination[property] = destination[property] || {};
        arguments.callee(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }
    return destination;
  };

  function buildOverlay(target){
    var body = document.getElementsByTagName('body')[0];
    var offset = getOffset(target);
    var borderWidth = inspectSettings.borderWidth;

    setOverlayMetrics(target);

    var overlayTop = buildOverlayBase(inspectSettings.ids.borderTop);
    var overlayRight = buildOverlayBase(inspectSettings.ids.borderBottom);
    var overlayBottom = buildOverlayBase(inspectSettings.ids.borderRight);
    var overlayLeft = buildOverlayBase(inspectSettings.ids.borderLeft);

    overlayTop.style.width = (target.offsetWidth + borderWidth) + 'px';
    overlayTop.style.height = borderWidth + 'px';
    overlayTop.style.top = (offset.top - borderWidth) + 'px';
    overlayTop.style.left = (offset.left - borderWidth) + 'px';

    overlayRight.style.width = borderWidth + 'px';
    overlayRight.style.height = (target.offsetHeight + borderWidth) + 'px';
    overlayRight.style.top = (offset.top - borderWidth) + 'px';
    overlayRight.style.left = (target.offsetWidth + offset.left) + 'px';

    overlayBottom.style.width = (target.offsetWidth + borderWidth) + 'px';
    overlayBottom.style.height = borderWidth + 'px';
    overlayBottom.style.top = (target.offsetHeight + offset.top) + 'px';
    overlayBottom.style.left = offset.left + 'px';

    overlayLeft.style.width = borderWidth + 'px';
    overlayLeft.style.height = (target.offsetHeight + borderWidth) + 'px';
    overlayLeft.style.top = offset.top + 'px';
    overlayLeft.style.left = (offset.left - borderWidth) + 'px';

    body.appendChild(overlayTop);
    body.appendChild(overlayRight);
    body.appendChild(overlayBottom);
    body.appendChild(overlayLeft);
  }

  function setOverlayMetrics(target){
    var offset = getOffset(target);

    currentTargetMetrics = {
      height: target.offsetHeight,
      width: target.offsetWidth,
      top: offset.top,
      left: offset.left
    }
  }

  function buildOverlayBase(id){
    var overlay = document.getElementById(id);
    if(!overlay) overlay = document.createElement('div');

    overlay.id = id;
    overlay.style.backgroundColor = inspectSettings.borderColor;
    overlay.style.zIndex = inspectSettings.zIndex;
    overlay.style.position = 'absolute';

    return overlay;
  }

  function removeOverlayBorders(){
    removeElement(document.getElementById(inspectSettings.ids.borderTop));
    removeElement(document.getElementById(inspectSettings.ids.borderBottom));
    removeElement(document.getElementById(inspectSettings.ids.borderRight));
    removeElement(document.getElementById(inspectSettings.ids.borderLeft));
  }

  function buildOverlayBackground(){
    var body = document.getElementsByTagName('body')[0];
    var background = document.createElement('div');

    background.id = inspectSettings.ids.background;
    background.style.width = currentTargetMetrics.width + 'px';
    background.style.height = currentTargetMetrics.height + 'px';
    background.style.position = 'absolute';
    background.style.top = currentTargetMetrics.top + 'px';
    background.style.left = currentTargetMetrics.left + 'px';
    background.style.backgroundColor = inspectSettings.borderColor;
    background.style.opacity = '0.2';
    background.style.zIndex = inspectSettings.zIndex;

    body.appendChild(background);
  }

  function removeOverlayBackground(){
    removeElement(document.getElementById(inspectSettings.ids.background));
  }

  function clickedInside(event){
    return currentTarget == event.target;
  }

  function freezeCurrentOverlay(){
    isFreezed = true;
    buildOverlayBackground();
    fireCallback(inspectSettings.onFreeze);
  }

  function unfreezeCurrentOverlay(){
    isFreezed = false;
    removeOverlayBackground();
    removeOverlayBorders();
    fireCallback(inspectSettings.onUnfreeze);
  }

  function fireCallback(callback, event){
    if(callback) callback.call(this, currentTarget, getPath(currentTarget), event);
  }

  function over(event){
    if(isFreezed) return false;

    currentTarget = event.target;
    buildOverlay(currentTarget);
  }

  function click(event){
    if(inspectSettings.freezeOnClick){
      if(isFreezed){
        unfreezeCurrentOverlay();
      }
      else {
        freezeCurrentOverlay();
        fireCallback(inspectSettings.onSelectElement, event);
      }
    }
    else {
      fireCallback(inspectSettings.onSelectElement, event);
    }

    event.stopPropagation();
    event.preventDefault();
  }

  function events(){
    addEvent(document, 'mouseover', over);
    addEvent(document, 'click', click);
  }

  window.inspectJS = {
    init: function(options){
      extend(inspectSettings, options);
      events();
    }
  };
})(window);
