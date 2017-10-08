Shader{
	Properties{
	}
	SubShader{
		Pass{
			vsh = `
				attribute vec4 a_position;
				attribute vec2 a_texCoord;
				attribute vec4 a_color;

				varying vec2 v_texCoord;
				varying vec4 v_color;

				void main()
				{
					gl_Position = CC_PMatrix * a_position;
					v_texCoord = a_texCoord + vec2(CC_Time.x, -CC_Time.x * 0.5);
					v_color = a_color;
				}
			`;

			fsh = `
				#ifdef GL_ES
					precision mediump float;
				#endif
				varying vec2 v_texCoord;
				varying vec4 v_color;
				void main()
				{
					gl_FragColor = texture(CC_Texture0, v_texCoord) * v_color;
				}
			`;
		}
	}
}
