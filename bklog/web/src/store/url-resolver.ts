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

// @ts-ignore
import { handleTransformToTimestamp } from '@/components/time-range/utils';
class RouteUrlResolver {
  private route;
  private resolver: Map<string, (str) => unknown>;
  private resolveFieldList: string[];

  constructor({ route, resolveFieldList }) {
    this.route = route;
    this.resolver = new Map<string, (str) => unknown>();
    this.resolveFieldList = resolveFieldList ?? this.getDefaultResolveFieldList();
    this.setDefaultResolver();
  }

  get query() {
    return this.route?.query ?? {};
  }

  public setDefaultResolveFieldList(val?) {
    this.resolveFieldList = val ?? this.getDefaultResolveFieldList();
  }

  public setResolver(key: string, fn: (str) => unknown) {
    this.resolver.set(key, fn);
  }

  /**
   * 将URL参数解析为store里面缓存的数据结构
   */
  public convertQueryToStore() {
    return this.resolveFieldList.reduce((output, key) => {
      const value = this.resolver.get(key)?.(this.query?.[key]) ?? this.commonRresolver(this.query?.[key]);
      if (value !== undefined) {
        return Object.assign(output, { [key]: value });
      }

      return output;
    }, {});
  }

  /**
   * 需要清理URL参数时，获取默认的参数配置列表
   * @returns
   */
  public getDefUrlQuery() {
    const routeQuery = this.query;
    const appendParamKeys = [...this.resolveFieldList, 'end_time'];
    const undefinedQuery = appendParamKeys.reduce((out, key) => Object.assign(out, { [key]: undefined }), {});
    return {
      ...routeQuery,
      ...undefinedQuery,
    };
  }

  private getDefaultResolveFieldList() {
    // 这里start_time 和 end_time 是一对，用于时间日期选择器
    // 所以如果解析必须要以 [start_time, end_time] 格式
    return [
      'addition',
      'keyword',
      'start_time',
      'end_time',
      'timezone',
      'unionList',
      'datePickerValue',
      'host_scopes',
      'ip_chooser',
    ];
  }

  private commonRresolver(str, next?) {
    if (str !== undefined && str !== null) {
      const val = decodeURIComponent(str);
      return next?.(str) ?? val;
    }

    return undefined;
  }

  private objectResolver(str) {
    return this.commonRresolver(str, val => JSON.parse(val));
  }

  private arrayResolver(str) {
    return this.objectResolver(str);
  }

  /**
   * datepicker时间范围格式化为标准时间格式
   * @param timeRange [start_time, end_time]
   */
  private dateTimeRangeResolver(timeRange: string[]) {
    const result = handleTransformToTimestamp(timeRange);
    return { start_time: result[0], end_time: result[1] };
  }

  private setDefaultResolver() {
    this.resolver.set('addition', this.arrayResolver.bind(this));
    this.resolver.set('unionList', this.arrayResolver.bind(this));
    this.resolver.set('host_scopes', this.objectResolver.bind(this));
    this.resolver.set('ip_chooser', this.objectResolver.bind(this));
    this.resolver.set('timeRange', this.dateTimeRangeResolver.bind(this));

    // datePicker默认直接获取URL中的 start_time, end_time
    this.resolver.set('datePickerValue', () => {
      return this.commonRresolver(this.query.start_time, value => {
        const endTime = this.commonRresolver(this.query.end_time) ?? value;
        return [value, endTime];
      });
    });

    this.resolver.set('start_time', val => {
      return this.commonRresolver(val, value => {
        const end_time = this.commonRresolver(this.query?.end_time) ?? value;
        return this.dateTimeRangeResolver([value, end_time]).start_time;
      });
    });

    this.resolver.set('end_time', val => {
      return this.commonRresolver(val, value => {
        const start_time = this.commonRresolver(this.query?.start_time) ?? value;
        return this.dateTimeRangeResolver([start_time, value]).end_time;
      });
    });
  }
}

export default RouteUrlResolver;