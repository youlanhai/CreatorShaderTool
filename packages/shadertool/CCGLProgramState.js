
function IntSetter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith1i(name, v);
	}
}

function FloatSetter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith1f(name, v);
	}
}

function Vec2Setter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith2f(name, v.x, v.y);
	}
}

function Vec3Setter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith3f(name, v.x, v.y, v.z);
	}
}

function Vec4Setter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith4f(name, v.x, v.y, v.z, v.w);
	}
}

function ColorSetter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWith4f(name, v.x, v.y, v.z, v.w);
	}
}

function Mat4Setter(v){
	return function(glProgram, name){
		glProgram.setUniformLocationWithMatrix4fv(name, v);
	}
}

function TextureSetter(v){
	return function(glProgram, name){
		Editor.log("bindTexture", name, v);
		let gl = glProgram._glContext;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE0, v);
		glProgram.setUniformLocationWith1i(name, 0);
	}
}

let GLProgramState = cc._Class.extend({

	ctor(glProgram){
		this.glProgram = glProgram;
		this.values = {};
	},

	setUniformInt(name, value){
		this.values[name] = IntSetter(value);
	},

	setUniformFloat(name, value){
		this.values[name] = FloatSetter(value);
	},

	setUniformVec2(name, value){
		this.values[name] = Vec2Setter(value);
	},

	setUniformVec3(name, value){
		this.values[name] = Vec3Setter(value);
	},

	setUniformVec4(name, value){
		this.values[name] = Vec4Setter(value);
	},

	setUniformMat4(name, value){
		this.values[name] = Mat4Setter(value);
	},

	setUniformTexture(name, value){
		this.values[name] = TextureSetter(value);
	},

	use(){
		this.glProgram.use();
		this.glProgram.setUniformsForBuiltins();

		for(let key in this.values){
			let val = this.values[key]
			val(this.glProgram, key);
		}
	},
})

GLProgramState.create = function(glProgram){
	return new GLProgramState(glProgram);
}

module.exports = GLProgramState
