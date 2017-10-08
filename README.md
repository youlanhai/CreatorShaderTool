# Creator Shader Tool
用于cocos creator的shader工具，支持类似于Unity3D Shader语法。

# shader
## 1. 概览
shader文件：`assets/resources/simple-shader.shader`

```ShaderLab
Shader "SimpleShader" {
    Properties{
        _MainTex("Main Tex", texture) = "";
        _Color("Main Color", color) = (1, 1, 1, 1);
    }
    SubShader{
        Pass{
            variants = (ENABLE_COLOR, ENABLE_TEXTURE);
            vsh = `
                attribute vec4 a_position;
                attribute vec2 a_texCoord;
                varying vec2 v_texCoord;
                void main()
                {
                    gl_Position = CC_PMatrix * a_position;
                    v_texCoord = a_texCoord;
                }
            `;
            fsh = `
            #ifdef GL_ES
                precision mediump float;
            #endif

            #ifdef ENABLE_TEXTURE
                varying vec2 v_texCoord;
                uniform sampler2D _MainTex;
            #endif

            #ifdef ENABLE_COLOR
                uniform vec4 _Color;
            #endif

                void main()
                {
                    vec4 color = vec4(1, 1, 1, 1);
            #ifdef ENABLE_TEXTURE
                    color = texture2D(_MainTex, v_texCoord);
            #endif

            #ifdef ENABLE_COLOR
                    color *= _Color;
            #endif
                    gl_FragColor = color;
                }
            `;
        }
    }
}
```

# 材质
## 1. 概览
材质文件：`assets/resources/materials/simple-all.mtl`

```json
{
    "shaderPath" : "resources/shaders/simple-shader.shader",
    "values" : {
        "_MainTex" : "resources/textures/tex00.jpg",
        "_Color" : [1, 0, 0, 1]
    },
    "variants" : ["ENABLE_COLOR", "ENABLE_TEXTURE"]
}
```

# TODO
+ 添加材质编辑工具
