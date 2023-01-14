#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { webSiteAppStack } from '../lib/cdk_website-stack';


const webSiteApp = new cdk.App(); 
const stackName = 'WebSiteStackDemo-'
new webSiteAppStack(webSiteApp, stackName, { stageName: 'DEV_DB', stackName: stackName });
