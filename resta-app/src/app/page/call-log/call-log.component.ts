// service-call-log.component.ts

import { Component } from '@angular/core';
import { AppModule } from '../../module/app.module';

@Component({
    selector: 'app-service-call-log',
    imports: [AppModule],
    templateUrl: './call-log.component.html',
    styleUrls: ['./call-log.component.scss']
})
export class ServiceCallLogComponent {

    logDialog = false;

    searchCustomer = '';

    selectedStatus: string = '';
    selectedService: string = '';

    serviceLogs = [
        {
            date: '24-04-2019',
            customerName: 'maison perumal',
            serviceType: 'AMC',
            problem: 'cctv problem',
            actionTaken: 'SERVICED',
            completedDate: '',
            status: 'PENDING',
            engineer: 'THARIC'
        },
        {
            date: '25-04-2019',
            customerName: 'maison perumal',
            serviceType: 'AMC',
            problem: 'networking',
            actionTaken: 'SERVICED',
            completedDate: '',
            status: 'PENDING',
            engineer: 'TAMIZ'
        },
        {
            date: '03-05-2019',
            customerName: 'ICG',
            serviceType: 'AMC',
            problem: 'printer colour delivery',
            actionTaken: 'SERVICED',
            completedDate: '03-05-2019',
            status: 'COMPLETED',
            engineer: 'TAMIZ'
        },
        {
            date: '06-05-2019',
            customerName: 'cluny convent',
            serviceType: 'AMC',
            problem: 'system problem',
            actionTaken: 'SERVICED',
            completedDate: '',
            status: 'PENDING',
            engineer: 'THARIC'
        }
    ];

    statusOptions = [
        { name: 'PENDING' },
        { name: 'COMPLETED' }
    ];

    serviceOptions = [
        { name: 'AMC' },
        { name: 'PC' },
        { name: 'NETWORK' }
    ];

    selectedLog: any = {};

    editLog(item: any) {
        this.selectedLog = { ...item };
        this.logDialog = true;
    }

}