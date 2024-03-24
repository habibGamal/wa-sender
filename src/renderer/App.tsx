/* eslint-disable no-restricted-syntax */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import {
  Form,
  Input,
  Upload,
  Button,
  ConfigProvider,
  theme,
  Divider,
  List,
  Typography,
  Row,
  InputNumber,
  Col,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import XLSX from 'xlsx';
import React, { useEffect } from 'react';
import logo from './assets/logo.png';
import logoWhatsapp from './assets/whatsapplogo.png';

async function readExcelFile(file: Blob): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as [
          string,
          string,
        ][];

        const numbersOnly = jsonData.flatMap(
          (item: [string, string]) => item[1],
        );
        resolve(numbersOnly);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
function Hello() {
  const [logs, setLogs] = React.useState<string[]>([]);
  const onFinish = async (values: any) => {
    values.attachments = values.attachment?.fileList.map(
      (file: any) => file.originFileObj.path,
    );
    values.attachment = values.attachment?.fileList[0]?.originFileObj?.path;
    values.csv = values.csv?.fileList[0]?.originFileObj;
    if (values.csv) {
      const numberList = await readExcelFile(values.csv);
      for (const item of numberList) {
        if (item === undefined) {
          setLogs(['Invalid CSV file']);
          return;
        }
      }
      values.csv = JSON.stringify(numberList);
    }
    console.log('Received values of form: ', values);
    window.electron.ipcRenderer.sendMessage('form-submission', values);
  };
  useEffect(() => {
    window.electron.ipcRenderer.on('form-submission', (arg) => {
      setLogs(JSON.parse(arg as string));
    });
  }, []);
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontSize: 18,
        },
      }}
    >
      <div className="logos-overlap">
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <div className="logo-wtsapp">
          <img src={logoWhatsapp} alt="logo" />
        </div>
      </div>
      <Row gutter={16}>
        <Col>
          <Form className="isolate" onFinish={onFinish}
            initialValues={{ startFrom: 0 }}
          >
            <Form.Item name="message">
              <Input.TextArea placeholder="Message content" />
            </Form.Item>

            <Form.Item name="csv">
              <Upload accept=".xlsx">
                <Button size="large" icon={<UploadOutlined />}>
                  Upload CSV file
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item name="attachment">
              <Upload accept="image/*,video/*" multiple>
                <Button size="large" icon={<UploadOutlined />}>
                  Upload Image/Video (Optional)
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item name="startFrom" label="Start from">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item>
              <Button size="large" type="primary" htmlType="submit">
                Submit
              </Button>
              <Button
                onClick={() =>
                  window.electron.ipcRenderer.sendMessage('stop-sender')
                }
                size="large"
                danger
                type="primary"
                style={{ marginLeft: '1rem' }}
              >
                Stop
              </Button>
              <Button
                onClick={() => window.electron.ipcRenderer.sendMessage('login')}
                size="large"
                style={{ marginLeft: '1rem' }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Col>
        <Col>
          <List
            className="loglist"
            header={<Typography.Text strong>Logs</Typography.Text>}
            bordered
            dataSource={logs}
            renderItem={(item, index) => (
              <List.Item>
                <Typography.Text>[{index + 1}]</Typography.Text> {item}
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
