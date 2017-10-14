"use strict";

var _STMaterialCache = require("./src/STMaterialCache");

var _STMaterialCache2 = _interopRequireDefault(_STMaterialCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

cc.Class({
    extends: cc.Component,

    properties: {
        materialPath: ""
    },

    onLoad: function onLoad() {
        var material = null;

        if (this.materialPath) {
            material = _STMaterialCache2.default.getOrCreate(this.materialPath);
        }
        this.material = material;

        if (material) {
            material.applyToNode(this.node);
        }
    }

});