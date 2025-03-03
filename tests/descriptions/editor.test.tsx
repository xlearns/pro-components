import type {
  ProDescriptionsActionType,
  ProDescriptionsItemProps,
} from '@ant-design/pro-descriptions';
import Descriptions from '@ant-design/pro-descriptions';
import type { RowEditableConfig } from '@ant-design/pro-utils';
import { act, fireEvent, render } from '@testing-library/react';
import { Form, InputNumber } from 'antd';
import useMergedState from 'rc-util/es/hooks/useMergedState';
import React, { useRef } from 'react';
import { waitForComponentToPaint } from '../util';

type DataSourceType = {
  id: number;
  title?: string;
  labels?: {
    name: string;
    color: string;
  }[];
  state?: string;
  time?: {
    created_at?: string;
  };
  children?: DataSourceType;
};

const defaultData: DataSourceType = {
  id: 624748504,
  title: '🐛 [BUG]yarn install命令 antd2.4.5会报错',
  labels: [{ name: 'bug', color: 'error' }],
  time: {
    created_at: '1590486176000',
  },
  state: 'processing',
};

const columns: ProDescriptionsItemProps<DataSourceType>[] = [
  {
    dataIndex: 'index',
    valueType: 'indexBorder',
    renderFormItem: () => <InputNumber />,
  },
  {
    title: '标题',
    dataIndex: 'title',
    copyable: true,
    ellipsis: true,
    tip: '标题过长会自动收缩',
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
  },
  {
    title: '状态',
    dataIndex: 'state',
    valueType: 'select',
    valueEnum: {
      all: { text: '全部', status: 'Default' },
      open: {
        text: '未解决',
        status: 'Error',
      },
      closed: {
        text: '已解决',
        status: 'Success',
      },
      processing: {
        text: '解决中',
        status: 'Processing',
      },
    },
  },
  {
    title: '创建时间',
    dataIndex: ['time', 'created_at'],
  },
];

const DescriptionsDemo = (
  props: {
    type?: 'multiple';
    defaultKeys?: React.Key[];
    editorRowKeys?: React.Key[];
    onEditorChange?: (editorRowKeys: React.Key[]) => void;
    dataSource?: DataSourceType;
    onDataSourceChange?: (dataSource: DataSourceType) => void;
  } & RowEditableConfig<DataSourceType>,
) => {
  const [form] = Form.useForm();
  const actionRef = useRef<ProDescriptionsActionType>();
  const [editableKeys, setEditorRowKeys] = useMergedState<React.Key[]>(
    () => props.defaultKeys || [],
    {
      value: props.editorRowKeys,
      onChange: props.onEditorChange,
    },
  );
  const [dataSource, setDataSource] = useMergedState<DataSourceType, DataSourceType>(
    props.dataSource as any,
    {
      value: props.dataSource,
      onChange: props.onDataSourceChange,
    },
  );
  return (
    <Descriptions<DataSourceType>
      columns={columns}
      actionRef={actionRef}
      request={async () => ({
        data: defaultData,
        total: 3,
        success: true,
      })}
      title={
        <a
          id="reset_test"
          onClick={() => {
            form.resetFields();
          }}
        >
          重置
        </a>
      }
      dataSource={dataSource}
      onDataSourceChange={setDataSource}
      editable={{
        ...props,
        form,
        type: props.type,
        editableKeys,
        onSave: props.onSave,
        onChange: (keys) => setEditorRowKeys(keys),
      }}
    />
  );
};

describe('Descriptions', () => {
  it('📝 Descriptions close editable', async () => {
    const wrapper = render(
      <Descriptions<DataSourceType> columns={columns} dataSource={defaultData} />,
    );
    await waitForComponentToPaint(wrapper, 100);
    expect(!!wrapper.baseElement.querySelector('.anticon-edit')).toBeFalsy();
  });

  it('📝 Descriptions support editable', async () => {
    const wrapper = render(
      <Descriptions<DataSourceType> columns={columns} dataSource={defaultData} editable={{}} />,
    );
    await waitForComponentToPaint(wrapper, 100);
    expect(!!wrapper.baseElement.querySelector('.anticon-edit')).toBeTruthy();
  });

  it('📝 support onEditorChange', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[0]?.click();
    });
    await waitForComponentToPaint(wrapper);
    expect(fn).toBeCalledWith(['title']);
  });

  it('📝 support set Form', async () => {
    const wrapper = render(<DescriptionsDemo editorRowKeys={['title']} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      fireEvent.change(
        wrapper.baseElement
          .querySelectorAll<HTMLSpanElement>(
            'td.ant-descriptions-item .ant-descriptions-item-content',
          )[0]
          .querySelectorAll('.ant-input')[0],
        { target: { value: 'test' } },
      );
    });
    await waitForComponentToPaint(wrapper, 200);

    expect(wrapper.queryByDisplayValue('test')).toBeTruthy();

    act(() => {
      wrapper.queryByText('重置')?.click();
    });
    await waitForComponentToPaint(wrapper, 200);

    expect(wrapper.queryByDisplayValue('🐛 [BUG]yarn install命令 antd2.4.5会报错')).toBeTruthy();
  });

  it('📝 renderFormItem run defaultRender', async () => {
    const wrapper = render(
      <Descriptions<DataSourceType>
        editable={{
          editableKeys: ['title'],
        }}
        columns={[
          {
            dataIndex: 'title',
            renderFormItem: (item, config) => {
              return config.defaultRender(item);
            },
          },
        ]}
        dataSource={defaultData}
      />,
    );
    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it('📝 columns support editable test', async () => {
    const wrapper = render(
      <Descriptions
        editable={{
          editableKeys: ['title'],
        }}
        columns={[
          {
            dataIndex: 'title',
            editable: (text, record, index) => {
              return index === 1;
            },
          },
          {
            dataIndex: 'title2',
            editable: false,
          },
        ]}
        dataSource={defaultData}
      />,
    );
    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it('📝 support actionRender', async () => {
    const wrapper = render(
      <Descriptions
        editable={{
          editableKeys: ['title'],
          actionRender: () => [
            <div key="test" id="test">
              xx
            </div>,
          ],
        }}
        columns={[
          {
            dataIndex: 'title',
            editable: (text, record, index) => {
              return index === 1;
            },
          },
          {
            dataIndex: 'title2',
            editable: false,
          },
        ]}
        dataSource={defaultData}
      />,
    );
    expect(!!wrapper.queryByText('xx')).toBe(true);
  });

  it('📝 support editorRowKeys', async () => {
    const wrapper = render(<DescriptionsDemo editorRowKeys={['title']} />);
    await waitForComponentToPaint(wrapper, 1000);
    // 第一行应该编辑态
    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    // 第二行不应该是编辑态
    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelectorAll('input').length > 0,
    ).toBeFalsy();
  });

  it('📝 support cancel click', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelector<HTMLDivElement>('span.anticon-edit')?.click();
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelector<HTMLSpanElement>(`span.anticon-close`)
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeFalsy();
  });

  it('📝 support cancel click render false', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
        onCancel={async () => false}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelector<HTMLSpanElement>('span.anticon-edit')?.click();
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      wrapper.baseElement
        .querySelector<HTMLSpanElement>('td.ant-descriptions-item .ant-descriptions-item-content')
        ?.querySelector<HTMLSpanElement>(`span.anticon-close`)
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeFalsy();
  });

  it('📝 type=single, only edit one rows', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        defaultKeys={['state']}
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelector<HTMLSpanElement>('span.anticon-edit')?.click();
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).not.toBeCalled();
  });

  it('📝 type=multiple, edit multiple rows', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        type="multiple"
        defaultKeys={['state']}
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelector<HTMLSpanElement>('span.anticon-edit')?.click();
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(fn).toBeCalledWith(['state', 'title']);
  });

  it('📝 support onSave', async () => {
    const fn = jest.fn();
    const wrapper = render(<DescriptionsDemo onSave={(key) => fn(key)} />);
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[1]?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelector<HTMLSpanElement>('span.anticon-check')
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('state');
  });

  it('📝 support onSave support false', async () => {
    const fn = jest.fn();
    const wrapper = render(
      <DescriptionsDemo
        onSave={async (key) => {
          fn(key);
          return false;
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[1]?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelector<HTMLSpanElement>(`span.anticon-check`)
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    expect(fn).toBeCalledWith('state');
  });

  it('📝 support onCancel', async () => {
    const fn = jest.fn();
    const wrapper = render(<DescriptionsDemo onCancel={(key) => fn(key)} />);
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[1]?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[1]
        .querySelector<HTMLSpanElement>(`span.anticon-close`)
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('state');
  });

  it('📝 support form rules', async () => {
    const fn = jest.fn();
    const wrapper = render(<DescriptionsDemo onSave={(key, row) => fn(row.title)} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[0]?.click();
    });

    await waitForComponentToPaint(wrapper, 200);
    expect(
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll('input').length > 0,
    ).toBeTruthy();

    act(() => {
      fireEvent.change(
        wrapper.baseElement
          .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
          .querySelectorAll('input')![0],
        {
          target: {
            value: '',
          },
        },
      );
    });
    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
        .querySelectorAll<HTMLSpanElement>(`span.anticon-check`)[0]
        .click();
    });

    await waitForComponentToPaint(wrapper, 200);

    // 没有通过验证，不触发 onSave
    expect(fn).not.toBeCalled();

    act(() => {
      fireEvent.change(
        wrapper.baseElement
          .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
          .querySelectorAll('input')![0],
        {
          target: {
            value: 'qixian',
          },
        },
      );
    });

    act(() => {
      fireEvent.click(
        wrapper.baseElement
          .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[0]
          .querySelector('span.anticon-check')!,
        {},
      );
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('qixian');
  });

  it('📝 when dataIndex is array', async () => {
    const fn = jest.fn();
    const wrapper = render(<DescriptionsDemo onSave={(key, row) => fn(row?.time?.created_at)} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      wrapper.baseElement.querySelectorAll<HTMLSpanElement>('span.anticon-edit')[2]?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    act(() => {
      fireEvent.change(
        wrapper.baseElement
          .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[2]
          .querySelector(`input.ant-input`)!,
        {
          target: {
            value: '2021-05-26 09:42:56',
          },
        },
      );
    });

    act(() => {
      wrapper.baseElement
        .querySelectorAll('td.ant-descriptions-item .ant-descriptions-item-content')[2]
        .querySelectorAll<HTMLDivElement>(`span.anticon-check`)[0]
        ?.click();
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('2021-05-26 09:42:56');
  });
});
