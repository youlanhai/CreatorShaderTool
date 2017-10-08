Shader "SimpleShader" {
    Properties{ // 材质属性
        _MainTex("Main Tex", texture) = "";
        _Color("Main Color", color) = (1, 1, 1, 1);
    }
    SubShader{
        Pass{
            // 变种shader宏列表。shader会根据宏的排列组合，生成不同版本的shader
            variants = (ENABLE_COLOR, ENABLE_TEXTURE);
            // 顶点着色器源码
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
            // 片段着色器源码
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
