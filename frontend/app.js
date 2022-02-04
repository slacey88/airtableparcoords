import React, {useState} from 'react';
import {
    useBase,
    useRecords,
    useGlobalConfig,
    expandRecord,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    FormField,
    Input,
    Button,
    Box,
    Icon,
} from '@airtable/blocks/ui';
import {FieldType} from '@airtable/blocks/models';
import Chart from './chart';
import { ParentSize } from '@visx/responsive'; 

export default function App() {
    const base = useBase();

    // Read the user's choice for which table and view to use from globalConfig.
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get('selectedTableId');
    const viewId = globalConfig.get('selectedViewId');
    const doneFieldId = globalConfig.get('selectedDoneFieldId');

    const table = base.getTableByIdIfExists(tableId);
    const view = table ? table.getViewByIdIfExists(viewId) : null;
    const doneField = table ? table.getFieldByIdIfExists(doneFieldId) : null;

    // Don't need to fetch records if doneField doesn't exist (the field or it's parent table may
    // have been deleted, or may not have been selected yet.)
    const records = useRecords(doneField ? view : null, { });

    const data = records.map(record => { 
              return { 
                    "economy (mpg)": record.getCellValue("economy (mpg)"), 
                    "cylinders": record.getCellValue("cylinders"), 
                    "displacement (cc)": record.getCellValue("displacement (cc)"),
                    "power (hp)": record.getCellValue("power (hp)"),
                    "weight (lb)": record.getCellValue("weight (lb)"),
                    "0-60 mph (s)": record.getCellValue("0-60 mph (s)"),
                    "year": record.getCellValue("year")
                }
          })  
            
    const keys = ["economy (mpg)", "cylinders", "displacement (cc)", "power (hp)", "weight (lb)", "0-60 mph (s)", "year"]; 

    return (
        <div> 
            <ParentSize>
                {parent => {
                    return ( 
                        <Chart data={data} keys={keys} width={parent.width} /> 
                    )
                }}
            </ParentSize>   

            <Box padding={3} style={{visibility: 'hidden'}}>  
                <FormField label="Table">
                    <TablePickerSynced globalConfigKey="selectedTableId" />
                </FormField>
                <FormField label="View">
                    <ViewPickerSynced table={table} globalConfigKey="selectedViewId" />
                </FormField>
                <FormField label="Field" marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey="selectedDoneFieldId"
                        placeholder="Pick a field..." 
                    />
                </FormField> 
            </Box>
        </div>
    );
} 