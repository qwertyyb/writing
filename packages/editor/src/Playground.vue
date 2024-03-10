<template>
  <div class="playground">
    <document-editor
      v-model="data"
      @update:model-value="updateHandler"
      :upload="uploadHandler"
    ></document-editor>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import DocumentEditor from './DocumentEditor.vue';
import { createBlock, createBlockId } from './models/block';

const data = ref({
  id: createBlockId(),
  type: 'doc',
  data: {
    title: 'Editor编辑器演示',
  },
  children: [
    createBlock({
      type: 'toc',
    }),
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '普通文本' }]
      }
    }),
    {
      id: createBlockId(),
      type: 'text',
      data: {
        ops: [{insert: '好好学习，天天向上\n'}]
      },
      children: []
    },
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '引用' }]
      }
    }),
    createBlock({
      type: 'block-quote',
      children: [
        createBlock({
          type: 'text',
          data: { ops: [{ insert: '这是引用内容1' }] }
        }),
        createBlock({
          type: 'text',
          data: { ops: [{ insert: '这是引用内容2' }] }
        })
      ]
    }),
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '带格式的文本' }]
      }
    }),
    {
      id: createBlockId(),
      type: 'text',
      data: {
        ops: [
          {insert: '粗体', attributes: { bold: true } },
          {insert: '斜体', attributes: { italic: true } },
          {insert: '代码', attributes: { code: true } },
          {insert: '下划线', attributes: { underline: true } },
          {insert: '删除线', attributes: { strike: true } },
          {insert: '链接', attributes: { link: location.href } },
          {insert: '字体小', attributes: { size: '10px' } },
          {insert: '字体大', attributes: { size: '36px' } },
          {insert: '背景颜色', attributes: { background: '#f00' } },
          {insert: '文字颜色', attributes: { background: '#f0f' } },
          {insert: '上标', attributes: { script: 'super' } },
          {insert: '下标', attributes: { script: 'sub' } },
          {insert: '\n'}]
      },
      children: []
    },
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '代码块' }]
      }
    }),
    createBlock({
      type: 'code',
      data: {
        text: 'console.log("hello world!")\nconst test = true'
      }
    }),
    createBlock({
      type: 'heading2',
      data: { ops: [{insert: '分隔线\n' }] }
    }),
    createBlock({
      type: 'divider'
    }),
    createBlock({
      type: 'heading2',
      data: { ops: [{insert: '折叠内容\n' }] }
    }),
    createBlock({
      type: 'details',
      data: {
        summary: createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '这是简洁的内容\n' }]
          }
        })
      },
      children: [
        createBlock({
          type: 'text',
          data: { ops: [{ insert: '内容1\n' }] }
        }),
        createBlock({
          type: 'text',
          data: { ops: [{ insert: '内容2\n' }] }
        })
      ]
    }),
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '列表' }]
      }
    }),
    createBlock({
      type: 'heading3',
      data: {
        ops: [{ insert: '有序列表' }]
      }
    }),
    createBlock({
      type: 'ordered-list',
      data: {},
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '有序列表第一项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '有序列表第二项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '有序列表第三项' }]
          }
        })
      ]
    }),
    createBlock({
      type: 'heading3',
      data: {
        ops: [{ insert: '无序列表' }]
      }
    }),
    createBlock({
      type: 'unordered-list',
      data: {},
      children: [
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第一项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第二项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第三项' }]
          }
        })
      ]
    }),
    createBlock({
      type: 'heading3',
      data: {
        ops: [{ insert: 'Todo列表' }]
      }
    }),
    createBlock({
      type: 'todo',
      data: {
        checked: {abcdefg: true}
      },
      children: [
        createBlock({
          id: 'abcdefg',
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第一项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第二项' }]
          }
        }),
        createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '无序列表第三项' }]
          }
        })
      ]
    }),
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: '图片' }]
      }
    }),
    createBlock({
      type: 'image',
      data: {
        src: 'https://via.placeholder.com/400x200',
        ratio: 2,
        size: 50,
        align: 'Center',
        title: createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '居中50%图片' }]
          }
        })
      }
    }),
    createBlock({
      type: 'image',
      data: {
        src: 'https://via.placeholder.com/400x200',
        ratio: 2,
        size: 25,
        align: 'Left',
        title: createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '居左25%图片' }]
          }
        })
      }
    }),
    createBlock({
      type: 'image',
      data: {
        src: 'https://via.placeholder.com/400x200',
        ratio: 2,
        size: 75,
        align: 'Right',
        title: createBlock({
          type: 'text',
          data: {
            ops: [{ insert: '居右75%图片' }]
          }
        })
      }
    }),
    createBlock({
      type: 'heading2',
      data: {
        ops: [{ insert: 'Excalidraw绘图' }]
      }
    }),
    createBlock({
      type: 'excalidraw',
      data: {
          "excalidraw": {
              "elements": [
                  {
                      "type": "ellipse",
                      "version": 263,
                      "versionNonce": 877530722,
                      "isDeleted": false,
                      "id": "9Yl0j-WAaQtqijz3AiGM6",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 779.67578125,
                      "y": 81.94087219238281,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 45.03515625,
                      "height": 47.5625,
                      "seed": 340891904,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880555913,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 220,
                      "versionNonce": 1610270014,
                      "isDeleted": false,
                      "id": "_mThcVQqGH_JgfX-VKp9v",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 777.724609375,
                      "y": -48.48511505126953,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 45.03515625,
                      "height": 47.5625,
                      "seed": 649682750,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880562897,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 271,
                      "versionNonce": 730152254,
                      "isDeleted": false,
                      "id": "YY2a0VA-QcoNtH_emW_oK",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 781.306640625,
                      "y": 155.72582244873047,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 45.03515625,
                      "height": 47.5625,
                      "seed": 1174218686,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880560114,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 272,
                      "versionNonce": 298181346,
                      "isDeleted": false,
                      "id": "yIKA_REwJlCgN2GmNDS6C",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 778.826171875,
                      "y": 15.718009948730469,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 45.03515625,
                      "height": 47.5625,
                      "seed": 1682493502,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880553596,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 41,
                      "versionNonce": 688945086,
                      "isDeleted": false,
                      "id": "uGbZ3aecTqdCex1NUR8cK",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 558.40234375,
                      "y": 0.9172286987304688,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 50.98046875,
                      "height": 50.98046875,
                      "seed": 2124221886,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880571297,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 81,
                      "versionNonce": 139829986,
                      "isDeleted": false,
                      "id": "sn9W23rFnk-_EWOfUVlmP",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 560.07421875,
                      "y": 114.41332244873047,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 55.6875,
                      "height": 55.6875,
                      "seed": 1374081022,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880578281,
                      "link": null,
                      "locked": false
                  },
                  {
                      "type": "ellipse",
                      "version": 41,
                      "versionNonce": 1362028222,
                      "isDeleted": false,
                      "id": "YH5B4H0PPI68gZQqPSjfh",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "angle": 0,
                      "x": 419.09765625,
                      "y": 73.14769744873047,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "width": 44.65625,
                      "height": 44.65625,
                      "seed": 2089800290,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 2
                      },
                      "boundElements": [],
                      "updated": 1709880588749,
                      "link": null,
                      "locked": false
                  },
                  {
                      "id": "ttXDC5kcr2dWB1QQ_Nz0g",
                      "type": "rectangle",
                      "x": 472.43194580078125,
                      "y": -84.75690460205078,
                      "width": 65.61370849609375,
                      "height": 64.7911376953125,
                      "angle": 0,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 3
                      },
                      "seed": 2083792321,
                      "version": 28,
                      "versionNonce": 134217313,
                      "isDeleted": false,
                      "boundElements": null,
                      "updated": 1709999804131,
                      "link": null,
                      "locked": false
                  },
                  {
                      "id": "nMw6PAmMBXayDMeUKy6yI",
                      "type": "rectangle",
                      "x": 661.146240234375,
                      "y": -81.88672637939453,
                      "width": 219.974853515625,
                      "height": 304.9971923828125,
                      "angle": 0,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": {
                          "type": 3
                      },
                      "seed": 1662224961,
                      "version": 50,
                      "versionNonce": 2038166561,
                      "isDeleted": false,
                      "boundElements": null,
                      "updated": 1709999808696,
                      "link": null,
                      "locked": false
                  },
                  {
                      "id": "7HPqstikLm4FgjMKJfboB",
                      "type": "text",
                      "x": 440.7197265625,
                      "y": 198.90160369873047,
                      "width": 103.23992919921875,
                      "height": 25,
                      "angle": 0,
                      "strokeColor": "#1e1e1e",
                      "backgroundColor": "transparent",
                      "fillStyle": "solid",
                      "strokeWidth": 2,
                      "strokeStyle": "solid",
                      "roughness": 1,
                      "opacity": 100,
                      "groupIds": [],
                      "frameId": null,
                      "roundness": null,
                      "seed": 1666457569,
                      "version": 12,
                      "versionNonce": 246085135,
                      "isDeleted": false,
                      "boundElements": null,
                      "updated": 1709999817101,
                      "link": null,
                      "locked": false,
                      "text": "Excalidraw",
                      "fontSize": 20,
                      "fontFamily": 1,
                      "textAlign": "left",
                      "verticalAlign": "top",
                      "baseline": 18,
                      "containerId": null,
                      "originalText": "Excalidraw",
                      "lineHeight": 1.25
                  }
              ],
              "files": {}
          },
          "cover": {
              "src": "/assets/excalidraw-cover.png",
              "ratio": 1.4695121951219512,
              "align": "Center",
              "title": {
                  "type": "text",
                  "data": {
                      "ops": [{insert: 'Excalidraw绘图标题'}]
                  },
                  "id": "b3b34138cf08",
                  "children": []
              },
              "size": 50
          }
      }
    })
  ]
})

const updateHandler = (content: any) => {
  console.log('change', content)
}

const uploadHandler = async (file: Blob | File) => {
  return URL.createObjectURL(file)
}
</script>

<style lang="less" scoped>
.playground {
  width: 80vw;
  margin: 0 auto;
}
</style>