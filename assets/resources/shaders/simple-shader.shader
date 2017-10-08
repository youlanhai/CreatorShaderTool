Shader "SimpleShader" {
    Properties{
        _MainTex("Main Tex", texture) = "";
        _Color("Main Color", color) = (1, 1, 1, 1);
    }
    SubShader{
        Pass{
            variants = (ENABLE_COLOR, );
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
                varying vec2 v_texCoord;
                uniform sampler2D _MainTex;
            #ifdef ENABLE_COLOR
                uniform vec4 _Color;
            #endif
                void main()
                {
            #ifdef ENABLE_COLOR
                    gl_FragColor = texture2D(_MainTex, v_texCoord) * _Color;
            #else
                    gl_FragColor = texture2D(_MainTex, v_texCoord);
            #endif
                }
            `;
        }
    }
}
