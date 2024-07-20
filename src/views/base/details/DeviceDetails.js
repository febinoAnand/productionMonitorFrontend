import React, { useState, useEffect } from 'react';
import { cilPen, cilTrash } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTooltip,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormInput,
  CFormLabel
} from '@coreui/react';

const BaseURL = "https://productionb.univa.cloud/"; 
const url = `${BaseURL}devices/device/`; 

const DeviceDetails = () => {
  const [deviceList, setDeviceList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); 
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setDeviceList(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const toggleModal = (mode = '', device = null) => {
    setModalMode(mode);
    setSelectedDevice(device);
    setShowModal(!showModal);
  };

  const handleEditClick = (device) => {
    toggleModal('update', device);
  };

  const handleDeleteClick = async (deviceId) => {
    try {
      const response = await fetch(`${url}${deviceId}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setDeviceList(deviceList.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const handleFormData = (e) => {
    const { id, value } = e.target;
    setSelectedDevice(prevDevice => ({
      ...prevDevice,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedDevice),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const newDevice = await response.json();
        setDeviceList([...deviceList, newDevice]);
      } else if (modalMode === 'update') {
        // Update existing device logic
        const response = await fetch(`${url}${selectedDevice.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedDevice),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const updatedDevice = await response.json();
        setDeviceList(deviceList.map(device =>
          device.id === updatedDevice.id ? updatedDevice : device
        ));
      }
      toggleModal(); 
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Device Details</strong>
              <CButton className="float-end" color="success" variant='outline' onClick={() => toggleModal('add')}>
                Add Device
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable striped hover>
                <CTableHead color='dark'>
                  <CTableRow>
                    <CTableHeaderCell scope="col">Si No</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Device Name</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Device Token</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Hardware Version</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Software Version</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Protocol</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Pub Topic</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Sub Topic</CTableHeaderCell>
                    <CTableHeaderCell scope="col">API Path</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {deviceList.map((device, index) => (
                    <CTableRow key={device.id}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>{device.device_name}</CTableDataCell>
                      <CTableDataCell>{device.device_token}</CTableDataCell>
                      <CTableDataCell>{device.hardware_version}</CTableDataCell>
                      <CTableDataCell>{device.software_version}</CTableDataCell>
                      <CTableDataCell>{device.protocol}</CTableDataCell>
                      <CTableDataCell>{device.pub_topic}</CTableDataCell>
                      <CTableDataCell>{device.sub_topic}</CTableDataCell>
                      <CTableDataCell>{device.api_path}</CTableDataCell>
                      <CTableDataCell>
                                                    <div className="d-flex gap-2">
                                                        <CTooltip content="Edit Group">
                                                            <CButton color="primary" onClick={() => handleEditClick(device)}>
                                                                <CIcon icon={cilPen} />
                                                            </CButton>
                                                        </CTooltip>
                                                        <CTooltip content="Delete Group">
                                                            <CButton color="primary" onClick={() => handleDeleteClick(device.id)}>
                                                                <CIcon icon={cilTrash} />
                                                            </CButton>
                                                        </CTooltip>
                                                    </div>
                                                </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal
        visible={showModal}
        onClose={() => toggleModal()}
        size="xl"
      >
        <CModalHeader>
          <CModalTitle>{modalMode === 'update' ? 'Update Device' : 'Add Device'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel htmlFor="device_name">Device Name</CFormLabel>
                <CFormInput
                  type="text"
                  id="device_name"
                  placeholder="Enter Device Name"
                  value={selectedDevice?.device_name || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="device_token">Device Token</CFormLabel>
                <CFormInput
                  type="text"
                  id="device_token"
                  placeholder="Enter Device Token"
                  value={selectedDevice?.device_token || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="hardware_version">Hardware Version</CFormLabel>
                <CFormInput
                  type="text"
                  id="hardware_version"
                  placeholder="Enter Hardware Version"
                  value={selectedDevice?.hardware_version || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="software_version">Software Version</CFormLabel>
                <CFormInput
                  type="text"
                  id="software_version"
                  placeholder="Enter Software Version"
                  value={selectedDevice?.software_version || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="protocol">Protocol</CFormLabel>
                <CFormInput
                  type="text"
                  id="protocol"
                  placeholder="Enter Protocol"
                  value={selectedDevice?.protocol || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="pub_topic">Pub Topic</CFormLabel>
                <CFormInput
                  type="text"
                  id="pub_topic"
                  placeholder="Enter Pub Topic"
                  value={selectedDevice?.pub_topic || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="sub_topic">Sub Topic</CFormLabel>
                <CFormInput
                  type="text"
                  id="sub_topic"
                  placeholder="Enter Sub Topic"
                  value={selectedDevice?.sub_topic || ''}
                  onChange={handleFormData}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor="api_path">API Path</CFormLabel>
                <CFormInput
                  type="text"
                  id="api_path"
                  placeholder="Enter API Path"
                  value={selectedDevice?.api_path || ''}
                  onChange={handleFormData}
                />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => toggleModal()}>
              Close
            </CButton>
            <CButton color="primary" type="submit">
              {modalMode === 'update' ? 'Update' : 'Add'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  );
};

export default DeviceDetails;