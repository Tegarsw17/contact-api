import { prismaClient } from '../application/database'
import { ResponseError } from '../error/response-error'
import {
  createAddressValidation,
  getAddressValidation,
} from '../validation/address-validation'
import { getContactValidation } from '../validation/contact-validatioin'
import { validate } from '../validation/validation'

const checkContactMustExist = async (user, contactId) => {
  contactId = validate(getContactValidation, contactId)

  const totalContactInDatabase = await prismaClient.contact.count({
    where: {
      username: user.username,
      id: contactId,
    },
  })

  if (totalContactInDatabase !== 1) {
    throw new ResponseError(404, 'Contact is not found')
  }

  return contactId
}

const create = async (user, contactId, request) => {
  contactId = await checkContactMustExist(user, contactId)

  const address = validate(createAddressValidation, request)
  address.contact_id = contactId

  return prismaClient.address.create({
    data: address,
    select: {
      id: true,
      street: true,
      city: true,
      province: true,
      country: true,
      postal_code: true,
    },
  })
}

const get = async (user, contactId, addressId) => {
  contactId = await checkContactMustExist(user, contactId)
  addressId = validate(getAddressValidation, addressId)

  const address = await prismaClient.address.findFirst({
    where: {
      contact_id: contactId,
      id: addressId,
    },
    select: {
      id: true,
      street: true,
      city: true,
      province: true,
      country: true,
      postal_code: true,
    },
  })

  if (!address) {
    throw new ResponseError(404, 'address not found')
  }

  return address
}

export default {
  create,
  get,
}
