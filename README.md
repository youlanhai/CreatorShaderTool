# Creator Shader Tool
用于cocos creator的shader工具，支持类似于Unity3D Shader语法。目前shader和材质系统基本可用，后面有时间再开发一个材质编辑器。

# shader
## 1. 概览
shader文件：`assets/resources/simple-shader.shader`

```ShaderLab
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
```
## 2. 说明
shader文件必须以`.shader`为文件后缀名，最好位于`assets/resources`的子目录中，因为目前只能根据路径去动态加载resources目录下的资源。

### Shader
所有的shader都以关键字`Shader`开始。语法格式：
```
Shader [name] {
    Properties{}
    SubShader{}
    SubShader{}
    [...]
}
```
name可以缺省，支持多个SubShader

### Properties
属性表，用于材质编辑器(暂时还没开发出来)读取和设置参数。语法格式：

```
Properties {
    变量名("说明", 类型) = 默认值;
    [...]
}
```

支持的变量类型：

类型  | 说明
------|-------
int   | 单个整数，0
float | 单个浮点数，3.14 
vec2  | 两个浮点数，(1, 2)
vec3  | 3个浮点数，(1, 2, 3)
vec4  | 4个浮点数，(1, 2, 3, 4)
texture  | 纹理路径，"path/to/texture"
color  | 4个浮点数，表示rgba，(0.1, 0.2, 0.3, 0.4)

### SubShader
子着色器，每个子着色器可包括多个Pass。引擎会根据渲染配置激活不同的子着色器(暂时没有自动选择的功能)。语法格式：
```
SubShader{
    Pass{}
    Pass{}
    [...]
}
```

### Pass
一个通道就对应一次渲染，多个通道就意味着一个物体要渲染多次。目前cocos2d-x不支持多通道渲染(可以自定义渲染)，因此这里只取第一个通道。

一个通道对应一组着色器代码，但是工具会针对变种宏(variant)，自动生成不同的着色器对象，运行时根据外部传入的不同宏，选择不同的着色器对象。

语法格式：
```
Pass{
    variants = (宏1, 宏2, [...]);
    valiadPairs = ((宏1), (宏1, 宏2), [...]);
    vsh = "";
    fsh = "";
}
```

参数说明：

参数  | 说明
------|--------
variants | 宏列表。工具会按照排列组合，生成不同的代码。宏越多，排列组合也就越多(n的阶乘个)。建议不要使用太多宏。
valiadPairs | 合法的宏组合列表。有时候自动排列组合出来的参数不一定会用到，通过手动指定合法列表，减少生成不必要的着色器对象。
vsh | 顶点着色器代码。符号"`"，支持跨行字符串
fsh | 片段着色器代码。

## 3. 用法
shader要结合材质一起使用，但也可以通过代码直接加载出来。
```
import STShaderCahce from "STShaderCahce";
let shader = STShaderCahce.getOrCreate("path/to/shader");
let program = shader.matchSubshader(flags).matchProgram(variants);
let glProgram = program.getGLProgram();
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

## 2. 说明
材质文件也同样需要位于`assets/resources`子目录。

### shaderPath
所使用的shader文件的路径

### values
向shader输入的参数。对应着shader的Properties属性

### variants
支持的变种宏列表。工具会根据这里提供参数去匹配Pass里的着色器对象。

## 3. 用法
### 编辑器
给结点添加`STMaterialComponent`组件，在`Material Path`输入框中输入材质文件的路径(含后缀名)。

### 代码
```
import STMaterialCache from "STMaterialCache";
let material = STMaterialCache.getOrCreate("path/to/material");
material.applyToNode(this.node);
```

# TODO
+ 添加材质编辑工具
