cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!'
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;
        if(!cc.sys.isNative){
            this.label.string = "暂不支持web平台";
        }
    },

    // called every frame
    update: function (dt) {

    },
});
