/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { onMounted, Ref, onUnmounted } from 'vue';

import { debounce, isElement } from 'lodash';

export default (
  target: (() => HTMLElement | string) | Ref<HTMLElement> | string,
  callbackFn: (entry: ResizeObserverEntry) => void,
) => {
  const debounceCallback = debounce(entry => {
    callbackFn?.(entry);
  }, 120);

  const getTarget = () => {
    if (typeof target === 'string') {
      return document.querySelector(target);
    }

    if (isElement(target)) {
      return target;
    }

    if (typeof target === 'function') {
      return target?.();
    }

    return target?.value;
  };

  let resizeObserver = null;
  const createResizeObserve = () => {
    const cellElement = getTarget();

    if (isElement(cellElement)) {
      // 创建一个 ResizeObserver 实例
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          // 获取元素的新高度
          debounceCallback(entry);
        }
      });

      resizeObserver?.observe(cellElement);
    }
  };

  const destoyResizeObserve = () => {
    const cellElement = getTarget();

    if (isElement(cellElement)) {
      resizeObserver?.unobserve(cellElement);
      resizeObserver?.disconnect();
      resizeObserver = null;
    }
  };

  onMounted(() => {
    createResizeObserve();
  });

  onUnmounted(() => {
    destoyResizeObserve();
  });

  return { destoyResizeObserve };
};
