import React from 'react';
import {DataTable} from '../../components/common/DataTable';
import {Panel} from '../../components/common/Panel';

export function Reviews({reviews = []}) {
  return <Panel title="Ratings and Reviews"><DataTable columns={['Customer', 'HomeChef', 'Rating', 'Comment']} rows={reviews.map(row => [row.customer, row.chef, row.rating, row.text])} /></Panel>;
}
