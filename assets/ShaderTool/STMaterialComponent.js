import STMaterialCache from "./src/STMaterialCache";

cc.Class({
    extends: cc.Component,

    properties: {
        materialPath : "",
    },

    onLoad: function () {
        let material = null;

        if(this.materialPath){
            material = STMaterialCache.getOrCreate(this.materialPath)
        }
        this.material = material;

        if(material){
            material.applyToNode(this.node);
        }
    },

});
