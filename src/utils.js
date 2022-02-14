import Path from 'path'
import Fs from 'fs'
import Jsonminify from 'jsonminify'

export const getPath = (filePath) => {
    return Path.join(__dirname, '../', ...filePath)
}

// const reg = /^node-modules\/uview-ui\S+/

/**
 * 获取 所有已注册的路由文件
 * @returns 
 */
export const getRouteFileAll = function (config) {
    try {
        const str = Jsonminify(Fs.readFileSync(getPath([config.publicPath, './pages.json']), 'utf8'))
        const { pages } = JSON.parse(str);

        return pages.map(item => getPath([config.publicPath, `/${item.path}.vue`]))
    } catch (e) {
        console.log(e)
        throw new Error('pages.json 解析错误')
    }
}

/**
 * 获取 ast 中静态和动态 class 内容
 * @param {*} ast
 * @returns 
 */
export const getClass = function (ast) {
    const staticName = ast.attrsMap['class'];
    const dynamicName = ast.attrsMap[':class'];

    return {
        hasStatic: staticName !== undefined,
        hasDynamic: dynamicName !== undefined,
        staticName,
        dynamicName
    }
}

/**
 * 添加代码到头部
 * @param {*} source 
 * @param {*} code 
 */
export const addCodeToHeader = function (source, code) {
    return source.replace(/<view(.*?)>/, s => s + code)
}

/**
 * 添加代码到尾部
 * @param {*} source 
 * @param {*} code 
 */
export const addCodeToFooter = function (source, code) {
    return source.replace(/(<\/view>)([\s|S]+)(<\/template>)/, s => code + s)
}

// /**
//  * 获取 App.vue 文件中 template 默认内容
//  * 先匹配标签再移除首位标签
//  * @param {*} source 
//  * @returns 
//  */
// function handle(source) {
//     return source.match(/(<template>).*?(<\/template>)/)[0].replace(/<(\/?)template>/g, '')
// }

/**
 * 获取 App.vue 文件中 template 默认内容
 * 先匹配标签再移除首位标签
 * @param {*} source 
 * @returns 
 */
export const handleAppTemplateAddCode = function (source) {
    // return source.match(/(?<=<\/template>)[\w\W]*/)[0]
    // 我们添加的代码
    let addCode = ''

    switch (process.env.UNI_PLATFORM) {
        case 'h5':
            // 获取App.vue中uniapp插入的代码和我们添加的代码
            const originTemplateCode = source.replace(/(?<=<\/template>)[\w\W]*<\/template>/, s => {
                // const originTemplateCode = source.replace(/(?<=<\/template>)[\w\W]*/, s => {
                addCode = s;
                return '';
            })

            // 移除我们添加的代码, 使代码还原
            source = source.replace(/<template>[\s\S]+<\/template>/, originTemplateCode)

            return {
                source,
                // originTemplateCode,
                addCode
            };

        case 'mp-weixin':
        case 'mp-alipay':
        case 'mp-baidu':
        case 'mp-toutiao':
        case 'mp-kuaishou':
        case 'mp-lark':
        case 'quickapp-webview':
        case 'app-plus':
            source = source.replace(/<template>[\s\S]+<\/template>/, s => {
                // const originTemplateCode = source.replace(/(?<=<\/template>)[\w\W]*/, s => {
                addCode = s;
                return '';
            })

            return {
                source,
                addCode
            }
    }
}

/**
 * 获取 template 代码中的每组闭合根标签
 * 先移除template标签再匹配
 * 例如：3组根闭合标签
 * ```
 * <text>123</text>
 * <view />
 * <view><text>123</text></view>
 * ```
 * @param {*} source 
 */
export const handleGetTemplateRowCode = function (source) {
    return source.replace(/<(\/?)template>/g, '').match(/(<.*? \/>)|(<.*?>([\w\s<>\/]+)<\/.*?>)/g)
}

/**
 * 获取 App.vue代码中实际添加到页面代码的头部或尾部标签
 * @param {*} labelList 
 * @returns 
 */
export const handleGetTemplateHeaderOrFooterLabelCode = function (labelList) {
    const header = [];
    const footer = [];

    let flag = false;

    labelList.forEach(label => {
        if (/\<view-router\s+\/>/.test(label)) {
            flag = true;
            return true;
        }

        if (flag) {
            footer.push(label)
        } else {
            header.push(label)
        }
    })

    return {
        header,
        footer
    }
}

/**
 * 处理 class 拼接
 * @param {string} source
 * @param {Object} ast
 * @param {Object} ast.attrsMap
 * @param {string} ast.attrsMap.class
 * @returns
 */
// export const handleClassJoin = function (source, ast) {
//     const classCode = getClass(ast)
//     // const static = / class=('|").*?('|")/;
//     const static = /\sclass=('|").*?('|")/;
//     const hasStaticReg = /^<\w+(.*?)(([\s\S]*?)class=('|").*?('|"))/;
//     // const dynamic = / :class="('?).*?('?)"/
//     const dynamic = /\s:class="('?).*?('?)"/
//     const hasDynamicReg = /^<\w+(.*?)(([\s\S]*?):class="('?).*?('?)")/

//     let res = source

//     // 静态 class
//     // class='name' 或 :class="'name'"
//     if (classCode.hasStatic && hasStaticReg.test(source) !== null) {
//         const className = classCode.staticName + ' ' + Config.WX_THEME_CLASS_KEY;

//         console.log('===== className =======')
//         console.log(className)
//         console.log('===== className =======')

//         res = source.replace(static, ` class="${className}"`)

//         console.log('======== handle source =========')
//         console.log(res)
//         console.log('======== handle source =========')
//     }

//     // 动态 class
//     // :class="nameList" 或 :class="nameList + ' name'" 或 :class="[nameList, 'name']"
//     else if (classCode.hasDynamic && hasDynamicReg.test(source) !== null) {
//         const className = classCode.dynamicName.replace(/\[|\]/g, '') + `, '${Config.WX_THEME_CLASS_KEY}'`;

//         res = source.replace(dynamic, ` :class="[${className}]"`)
//     }

//     // AST 匹配失败
//     else {
//         return `<view style="color:red;">${JSON.stringify(ast.attrsMap)}</view>`;
//     }

//     return res;
// }


/**
 * 替换 VNode 虚拟标签，例："<VNode-Navbar />"
 * @param {string} source
 */
// export const handleVNodeReplace = function (source) {
//     Object.keys(Config.VNode).forEach(name => {
//         const reg = new RegExp(`<${name}(\\s{0,})\/>`)

//         if (reg.test(source)) {
//             const template = Fs.readFileSync(Path.join(__dirname, '../', Config.VNode[name])).toString();

//             source = source.replace(reg, template)
//         }
//     })

//     return source
// }