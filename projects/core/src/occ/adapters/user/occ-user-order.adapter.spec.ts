import { HttpClientModule, HttpRequest } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { ORDER_NORMALIZER } from '../../../checkout/connectors/checkout/converters';
import { FeatureConfigService } from '../../../features-config/index';
import { ConsignmentTracking } from '../../../model/consignment-tracking.model';
import {
  CancellationRequestEntryInputList,
  Order,
  ReturnRequest,
  ReturnRequestEntryInputList,
} from '../../../model/order.model';
import {
  CONSIGNMENT_TRACKING_NORMALIZER,
  ORDER_HISTORY_NORMALIZER,
  ORDER_RETURN_REQUEST_INPUT_SERIALIZER,
  ORDER_RETURN_REQUEST_NORMALIZER,
  ORDER_RETURNS_NORMALIZER,
} from '../../../user/connectors/order/converters';
import { ConverterService } from '../../../util/index';
import { OccConfig } from '../../config/occ-config';
import { OccEndpointsService } from '../../services';
import { OccUserOrderAdapter } from './occ-user-order.adapter';
import {
  MockOccEndpointsService,
  mockOccModuleConfig,
} from './unit-test.helper';

const userId = '123';

const orderData: Order = {
  site: 'electronics',
  calculated: true,
  code: '00001004',
};
const consignmentCode = 'a00001004';

const returnRequest: ReturnRequest = { rma: 'test return request' };

class MockFeatureConfigService {
  isLevel(_featureLevel: string): boolean {
    return true;
  }
}

// Deprecated as of 1.1
const usersEndpoint = '/users';
const orderEndpoint = '/orders';

describe('OccUserOrderAdapter', () => {
  let occUserOrderAdapter: OccUserOrderAdapter;
  let httpMock: HttpTestingController;
  let converter: ConverterService;
  let occEnpointsService: OccEndpointsService;
  let featureConfigService: FeatureConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpClientTestingModule],
      providers: [
        OccUserOrderAdapter,
        { provide: OccConfig, useValue: mockOccModuleConfig },
        {
          provide: OccEndpointsService,
          useClass: MockOccEndpointsService,
        },
        { provide: FeatureConfigService, useClass: MockFeatureConfigService },
      ],
    });

    occUserOrderAdapter = TestBed.inject(OccUserOrderAdapter);
    httpMock = TestBed.inject(HttpTestingController);
    converter = TestBed.inject(ConverterService);
    occEnpointsService = TestBed.inject(OccEndpointsService);
    featureConfigService = TestBed.inject(FeatureConfigService);
    spyOn(converter, 'pipeable').and.callThrough();
    spyOn(converter, 'convert').and.callThrough();
    spyOn(occEnpointsService, 'getUrl').and.callThrough();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserOrders', () => {
    it('should fetch user Orders with default options', async(() => {
      const PAGE_SIZE = 5;
      occUserOrderAdapter.loadHistory(userId, PAGE_SIZE).subscribe();
      httpMock.expectOne((req: HttpRequest<any>) => {
        return req.method === 'GET';
      }, `GET method and url`);
      expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
        'orderHistory',
        {
          userId,
        },
        { pageSize: PAGE_SIZE.toString() }
      );
    }));

    it('should fetch user Orders with defined options', async(() => {
      const PAGE_SIZE = 5;
      const currentPage = 1;
      const sort = 'byDate';

      occUserOrderAdapter
        .loadHistory(userId, PAGE_SIZE, currentPage, sort)
        .subscribe();
      httpMock.expectOne((req: HttpRequest<any>) => {
        return req.method === 'GET';
      }, `GET method`);
      expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
        'orderHistory',
        {
          userId,
        },
        {
          pageSize: PAGE_SIZE.toString(),
          currentPage: currentPage.toString(),
          sort,
        }
      );
    }));

    it('should use converter', () => {
      occUserOrderAdapter.loadHistory(userId).subscribe();
      httpMock
        .expectOne((req: HttpRequest<any>) => {
          return req.method === 'GET';
        }, `GET method`)
        .flush({});
      expect(converter.pipeable).toHaveBeenCalledWith(ORDER_HISTORY_NORMALIZER);
    });
  });

  describe('getOrder', () => {
    it('should fetch a single order', async(() => {
      occUserOrderAdapter.load(userId, orderData.code).subscribe();
      httpMock.expectOne((req: HttpRequest<any>) => {
        return req.method === 'GET';
      }, `GET a single order`);
      expect(occEnpointsService.getUrl).toHaveBeenCalledWith('orderDetail', {
        userId,
        orderId: orderData.code,
      });
    }));

    it('should use converter', () => {
      occUserOrderAdapter.load(userId, orderData.code).subscribe();
      httpMock.expectOne(req => req.method === 'GET').flush({});
      expect(converter.pipeable).toHaveBeenCalledWith(ORDER_NORMALIZER);
    });
  });

  /**
   * @deprecated Since 1.1
   * Remove when legacy code is removed.
   */
  describe('legacy', () => {
    beforeEach(() => {
      spyOn(featureConfigService, 'isLevel').and.returnValue(false);
    });
    describe('getUserOrders', () => {
      it('should fetch user Orders with default options', async(() => {
        const PAGE_SIZE = 5;
        occUserOrderAdapter.loadHistory(userId, PAGE_SIZE).subscribe();
        httpMock.expectOne((req: HttpRequest<any>) => {
          return (
            req.url === usersEndpoint + `/${userId}` + orderEndpoint &&
            req.method === 'GET'
          );
        }, `GET method and url`);
      }));

      it('should fetch user Orders with defined options', async(() => {
        const PAGE_SIZE = 5;
        const currentPage = 1;
        const sort = 'byDate';

        occUserOrderAdapter
          .loadHistory(userId, PAGE_SIZE, currentPage, sort)
          .subscribe();
        const mockReq = httpMock.expectOne((req: HttpRequest<any>) => {
          return (
            req.url === usersEndpoint + `/${userId}` + orderEndpoint &&
            req.method === 'GET'
          );
        }, `GET method`);

        expect(mockReq.request.params.get('pageSize')).toEqual(
          PAGE_SIZE.toString()
        );
      }));

      it('should use converter', () => {
        occUserOrderAdapter.loadHistory(userId).subscribe();
        httpMock
          .expectOne((req: HttpRequest<any>) => {
            return req.method === 'GET';
          }, `GET method`)
          .flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(
          ORDER_HISTORY_NORMALIZER
        );
      });
    });

    describe('getOrder', () => {
      it('should fetch a single order', async(() => {
        occUserOrderAdapter.load(userId, orderData.code).subscribe();
        httpMock.expectOne((req: HttpRequest<any>) => {
          return (
            req.url ===
              usersEndpoint +
                `/${userId}` +
                orderEndpoint +
                '/' +
                orderData.code && req.method === 'GET'
          );
        }, `GET a single order`);
      }));

      it('should use converter', () => {
        occUserOrderAdapter.load(userId, orderData.code).subscribe();
        httpMock.expectOne(req => req.method === 'GET').flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(ORDER_NORMALIZER);
      });
    });

    describe('getConsignmentTracking', () => {
      it('should fetch a consignment tracking', async(() => {
        const tracking: ConsignmentTracking = {
          trackingID: '1234567890',
          trackingEvents: [],
        };
        occUserOrderAdapter
          .getConsignmentTracking(orderData.code, consignmentCode, userId)
          .subscribe(result => expect(result).toEqual(tracking));
        const mockReq = httpMock.expectOne(req => {
          return req.method === 'GET';
        }, `GET a consignment tracking`);
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
          'consignmentTracking',
          {
            userId,
            orderCode: orderData.code,
            consignmentCode,
          }
        );
        expect(mockReq.cancelled).toBeFalsy();
        expect(mockReq.request.responseType).toEqual('json');
        mockReq.flush(tracking);
      }));

      it('should use converter', () => {
        occUserOrderAdapter
          .getConsignmentTracking(orderData.code, consignmentCode, userId)
          .subscribe();
        httpMock
          .expectOne(req => {
            return req.method === 'GET';
          })
          .flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(
          CONSIGNMENT_TRACKING_NORMALIZER
        );
      });
    });

    describe('cancel', () => {
      it('should be able to cancel an order', async(() => {
        const cancelRequestInput: CancellationRequestEntryInputList = {
          cancellationRequestEntryInputs: [
            { orderEntryNumber: 0, quantity: 1 },
          ],
        };

        let result;
        occUserOrderAdapter
          .cancel(userId, orderData.code, cancelRequestInput)
          .subscribe(res => (result = res));

        const mockReq = httpMock.expectOne(req => {
          return req.method === 'POST';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith('cancelOrder', {
          userId,
          orderId: orderData.code,
        });
        expect(mockReq.cancelled).toBeFalsy();
        expect(mockReq.request.responseType).toEqual('json');
        mockReq.flush({});
        expect(result).toEqual({});
      }));
    });

    describe('createReturnRequest', () => {
      it('should be able to create an order return request', async(() => {
        const returnRequestInput: ReturnRequestEntryInputList = {
          orderCode: orderData.code,
          returnRequestEntryInputs: [{ orderEntryNumber: 0, quantity: 1 }],
        };

        let result;
        occUserOrderAdapter
          .createReturnRequest(userId, returnRequestInput)
          .subscribe(res => (result = res));

        const mockReq = httpMock.expectOne(req => {
          return req.method === 'POST';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith('returnOrder', {
          userId,
        });
        expect(mockReq.cancelled).toBeFalsy();
        expect(mockReq.request.responseType).toEqual('json');
        mockReq.flush(returnRequest);
        expect(result).toEqual(returnRequest);
        expect(converter.convert).toHaveBeenCalledWith(
          returnRequestInput,
          ORDER_RETURN_REQUEST_INPUT_SERIALIZER
        );
      }));

      it('should use converter', () => {
        const returnRequestInput: ReturnRequestEntryInputList = {};
        occUserOrderAdapter
          .createReturnRequest(userId, returnRequestInput)
          .subscribe();
        httpMock
          .expectOne(req => {
            return req.method === 'POST';
          })
          .flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(
          ORDER_RETURN_REQUEST_NORMALIZER
        );
      });
    });

    describe('loadReturnRequestList', () => {
      it('should fetch order return request list with default options', async(() => {
        occUserOrderAdapter.loadReturnRequestList(userId).subscribe();
        httpMock.expectOne((req: HttpRequest<any>) => {
          return req.method === 'GET';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
          'orderReturns',
          { userId },
          {}
        );
      }));

      it('should fetch user order return request list with defined options', async(() => {
        const PAGE_SIZE = 5;
        const currentPage = 1;
        const sort = 'byDate';

        occUserOrderAdapter
          .loadReturnRequestList(userId, PAGE_SIZE, currentPage, sort)
          .subscribe();
        httpMock.expectOne((req: HttpRequest<any>) => {
          return req.method === 'GET';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
          'orderReturns',
          { userId },
          {
            pageSize: PAGE_SIZE.toString(),
            currentPage: currentPage.toString(),
            sort,
          }
        );
      }));

      it('should use converter', () => {
        occUserOrderAdapter.loadReturnRequestList(userId).subscribe();
        httpMock
          .expectOne((req: HttpRequest<any>) => {
            return req.method === 'GET';
          })
          .flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(
          ORDER_RETURNS_NORMALIZER
        );
      });
    });

    describe('loadReturnRequestDetail', () => {
      it('should be able to load an order return request data', async(() => {
        let result;
        occUserOrderAdapter
          .loadReturnRequestDetail(userId, 'test')
          .subscribe(res => (result = res));

        const mockReq = httpMock.expectOne(req => {
          return req.method === 'GET';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith(
          'orderReturnDetail',
          {
            userId,
            returnRequestCode: 'test',
          }
        );
        expect(mockReq.cancelled).toBeFalsy();
        mockReq.flush({});
        expect(result).toEqual({});
      }));

      it('should use converter', () => {
        occUserOrderAdapter.loadReturnRequestDetail(userId, 'test').subscribe();
        httpMock
          .expectOne(req => {
            return req.method === 'GET';
          })
          .flush({});
        expect(converter.pipeable).toHaveBeenCalledWith(
          ORDER_RETURN_REQUEST_NORMALIZER
        );
      });
    });

    describe('cancelReturnRequest', () => {
      it('should be able to cancel one return request', async(() => {
        let result;
        occUserOrderAdapter
          .cancelReturnRequest(userId, 'returnCode', { status: 'CANCELLING' })
          .subscribe(res => (result = res));

        const mockReq = httpMock.expectOne(req => {
          return req.method === 'PATCH';
        });
        expect(occEnpointsService.getUrl).toHaveBeenCalledWith('cancelReturn', {
          userId,
          returnRequestCode: 'returnCode',
        });
        expect(mockReq.cancelled).toBeFalsy();
        expect(mockReq.request.responseType).toEqual('json');
        mockReq.flush({});
        expect(result).toEqual({});
      }));
    });
  });
});
