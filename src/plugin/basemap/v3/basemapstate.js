goog.provide('plugin.basemap.v3.BaseMapState');
goog.provide('plugin.basemap.v3.BaseMapTag');

goog.require('goog.string');
goog.require('os.net');
goog.require('os.state.v3.LayerState');
goog.require('plugin.basemap');
goog.require('plugin.basemap.layer.BaseMap');


/**
 * XML tags for base map state
 * @enum {string}
 */
plugin.basemap.v3.BaseMapTag = {
  MAX_ZOOM: 'maxZoom',
  MIN_ZOOM: 'minZoom'
};



/**
 * @extends {os.state.v3.LayerState}
 * @constructor
 */
plugin.basemap.v3.BaseMapState = function() {
  plugin.basemap.v3.BaseMapState.base(this, 'constructor');
  this.description = 'Saves the current map layers';
  this['enabled'] = false;
  this.rootAttrs = {
    'type': 'map'
  };
  this.title = 'Map Layers';

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.logger = plugin.basemap.v3.BaseMapState.LOGGER_;
};
goog.inherits(plugin.basemap.v3.BaseMapState, os.state.v3.LayerState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.basemap.v3.BaseMapState.LOGGER_ = goog.log.getLogger('plugin.basemap.v3.BaseMapState');


/**
 * @inheritDoc
 */
plugin.basemap.v3.BaseMapState.prototype.isValid = function(layer) {
  try {
    return layer instanceof plugin.basemap.layer.BaseMap && layer.getLayerOptions() != null;
  } catch (e) {
    // may not be a os.layer.ILayer... so don't persist it
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.basemap.v3.BaseMapState.prototype.layerToXML = function(layer, options, opt_exclusions, opt_layerConfig) {
  var layerEl = plugin.basemap.v3.BaseMapState.base(this, 'layerToXML',
      layer, options, opt_exclusions, opt_layerConfig);
  if (layerEl) {
    goog.dom.xml.setAttributes(layerEl, {
      'type': layer.getLayerOptions()['baseType'] || 'wms'
    });
  }
  return layerEl;
};


/**
 * @inheritDoc
 */
plugin.basemap.v3.BaseMapState.prototype.defaultConfigToXML = function(key, value, layerEl) {
  switch (key) {
    case 'minResolution':
      var maxZoom = Math.round(os.MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
      os.xml.appendElement(plugin.basemap.v3.BaseMapTag.MAX_ZOOM, layerEl, maxZoom);
      break;
    case 'maxResolution':
      var minZoom = Math.round(os.MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
      os.xml.appendElement(plugin.basemap.v3.BaseMapTag.MIN_ZOOM, layerEl, minZoom);
      break;
    case 'minZoom':
    case 'maxZoom':
      // ignore these - min/max resolution will be converted instead
      break;
    default:
      plugin.basemap.v3.BaseMapState.base(this, 'defaultConfigToXML', key, value, layerEl);
      break;
  }
};


/**
 * @inheritDoc
 */
plugin.basemap.v3.BaseMapState.prototype.xmlToOptions = function(node) {
  var options = plugin.basemap.v3.BaseMapState.base(this, 'xmlToOptions', node);
  options['baseType'] = options['type'].toUpperCase();
  options['layerType'] = plugin.basemap.LAYER_TYPE;
  options['type'] = plugin.basemap.TYPE;
  options['id'] = options['id'].replace(os.ui.data.BaseProvider.ID_DELIMITER, '-');

  if (typeof options['url'] == 'string') {
    options['crossOrigin'] = os.net.getCrossOrigin(/** @type {string} */ (options['url']));
  }

  // zoom is 1 higher in opensphere than in legacy apps
  if (typeof options['minZoom'] === 'number') {
    options['minZoom'] = options['minZoom'] + 1;
  }

  if (typeof options['maxZoom'] === 'number') {
    options['maxZoom'] = options['maxZoom'] + 1;
  }

  return options;
};
