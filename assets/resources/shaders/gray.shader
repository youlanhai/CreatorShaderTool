Shader "GrayShader" {
	
	Properties {
		// 一些测试属性。本shader用不到
		_color("color", color) = (1, 1, 1, 1);
		_time("time", float) = 1.234;
		_pos("position", vec3) = (0, 0, 0);
	}

	SubShader {
		Pass {
			// 测试变种宏。本shader用不到
			variants = (ENABLE_LIGHT, ENABLE_FOG, ENABLE_SHADOW);
			valiadPairs = (
				(ENABLE_LIGHT),
				(ENABLE_FOG, ENABLE_SHADOW),
			);

			vsh = `
				attribute vec4 a_position;
				attribute vec2 a_texCoord;
				attribute vec4 a_color;
				varying vec2 v_texCoord;
				varying vec4 v_fragmentColor;
				void main()
				{
					gl_Position = CC_PMatrix * a_position;
					v_fragmentColor = a_color;
					v_texCoord = a_texCoord;
				}
			`;

			fsh = `
				#ifdef GL_ES
				precision mediump float;
				#endif
				varying vec2 v_texCoord;
				void main()
				{
					vec3 v = texture2D(CC_Texture0, v_texCoord).rgb;
					float f = v.r * 0.299 + v.g * 0.587 + v.b * 0.114;
					gl_FragColor = vec4(f, f, f, 1.0);
				}
			`;
		}
	}

	Fallback "Diffuse";
}
