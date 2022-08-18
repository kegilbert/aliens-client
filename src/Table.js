import React from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import './Table.css';

const DatatablePage = (props) => {
  const { SearchBar } = Search;
  const afterSaveCell = (oldValue, newValue, row, column) => {
    row.data = newValue;
  };

  return (
    <ToolkitProvider
      keyField={ props.keyField }
      data={ props.data }
      columns={ props.columns }
      search={{
        defaultSearch: props.searchInput ?
          props.searchInput :
          ''
      }}
    >
      {innerprops => (
        <div style={{margin: '1%'}}>
        { props.search === true ?
          <SearchBar
            { ...innerprops.searchProps }
            onSearch={(e) => {innerprops.searchProps.onSearch(e); props.setSearchInput(e);}}
            style={{boxShadow: 'none', borderColor: 'grey'}}
            srText=''
          /> :
          <div />
        }
          <hr style={{marginTop: '0.6em'}}/>
          <BootstrapTable
            { ...innerprops.baseProps }
            rowStyle={{ fontSize: 'small' }}
            editCellStyle={{ fontSize: 'small' }}
            editorStyle={{ fontSize: 'small' }}
            cellEdit={ cellEditFactory({ mode: 'click', blurToSave: true, afterSaveCell }) }
            // striped   // Disabled due to expandrow causing visual jumps
            rowClasses={ props.rowClasses }
            selectRow={ props.selectRow }
            expandRow={ props.expandRow }
            defaultSorted={ props.defaultSorted }
            ref = { props.ref }
          />
        </div>
      )}

    </ToolkitProvider>
  );
}

export default DatatablePage;
