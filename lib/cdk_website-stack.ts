import { aws_cloudfront, aws_cloudfront_origins, aws_s3_deployment, CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface WebSiteAppProps extends StackProps {
  stageName: string,
}

export class webSiteAppStack extends Stack {
  constructor(scope: Construct, id: string, props: WebSiteAppProps) {
    super(scope, id, props);

    const s3websitebucket = new Bucket(this, `${props.stackName}-Bucket`, {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    })
    /**
     * Configure the Content Security Policies, So that application will handle the Corss Site Scripting
     */

    const policiesCSP = new aws_cloudfront.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: 'website-CSP-Policies',
      comment: 'A content security Policies for website',
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy: "default-src 'none';frame-ancestors 'none';  object-src 'none';script-src 'none'; connect-src 'self'; img-src 'self'; style-src 'self'", override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: aws_cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: aws_cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.seconds(31536000), includeSubdomains: true, override: true },
      },
    });


    /**
  * The CloudFront distribution caching and proxying our requests to our bucket
  */

    const cloudfrontDist = new Distribution(this, `${props.stackName}-cloudfront`, {
      defaultBehavior: {
        origin: new aws_cloudfront_origins.S3Origin(s3websitebucket),
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
        responseHeadersPolicy: policiesCSP,
      },
      defaultRootObject: "index.html",
    });

    /**
     * Output the distribution URLs sof we can pass it to extranal systems
     */
    new CfnOutput(this, `${props.stageName}-cloudfront-outpus`, {
      value: "https://" + cloudfrontDist.distributionDomainName
    });

    /**
     * Upload your build to the bucket and invalidate the Distributions
     */
    new aws_s3_deployment.BucketDeployment(this, `${props.stageName}-s3-BucketDeployment`, {
      distributionPaths: ["/", "/index.html"],
      distribution: cloudfrontDist,
      destinationBucket: s3websitebucket,
      sources: [aws_s3_deployment.Source.asset('./websites')]
    });
  }
}
